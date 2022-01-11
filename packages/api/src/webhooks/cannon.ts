import { ConsumeMessage } from "amqplib";
import { promises as dns } from "dns";
import isLocalIP from "is-local-ip";
import { Response } from "node-fetch";
import { v4 as uuid } from "uuid";
import { parse as parseUrl } from "url";

import { DB } from "../store/db";
import messages from "../store/messages";
import Queue from "../store/queue";
import Model from "../store/model";
import { DBWebhook } from "../store/webhook-table";
import { fetchWithTimeout } from "../util";
import logger from "../logger";
import { sign } from "../controllers/helpers";

const WEBHOOK_TIMEOUT = 5 * 1000;
const MAX_BACKOFF = 10 * 60 * 1000;
const BACKOFF_COEF = 1.2;
const MAX_RETRIES = 20;

export default class WebhookCannon {
  db: DB;
  store: Model;
  running: boolean;
  verifyUrls: boolean;
  resolver: any;
  queue: Queue;
  constructor({ db, store, verifyUrls, queue }) {
    this.db = db;
    this.store = store;
    this.running = true;
    this.verifyUrls = verifyUrls;
    this.resolver = new dns.Resolver();
    this.queue = queue;
    // this.start();
  }

  async start() {
    console.log("WEBHOOK CANNON STARTED");
    await this.queue.consume("webhooks", this.handleWebhookQueue.bind(this));
    await this.queue.consume("events", this.handleEventsQueue.bind(this));
  }

  async handleEventsQueue(data: ConsumeMessage) {
    let event: messages.WebhookEvent;
    try {
      event = JSON.parse(data.content.toString());
      console.log("events: got event message", event);
    } catch (err) {
      console.log("events: error parsing message", err);
      this.queue.ack(data);
      return;
    }

    let ack: boolean;
    try {
      ack = await this.processWebhookEvent(event);
    } catch (err) {
      ack = true;
      console.log("handleEventQueue Error ", err);
    } finally {
      if (ack) {
        this.queue.ack(data);
      } else {
        setTimeout(() => this.queue.nack(data), 1000);
      }
    }
  }

  async processWebhookEvent(event: messages.WebhookEvent): Promise<boolean> {
    if (event.event === "recording.ready") {
      if (event.payload?.sessionId) {
        // TODO: Remove this. Backward compat only during deploy
        event.sessionId = event.payload.sessionId;
        event.payload = { ...event.payload, sessionId: undefined };
      }
      const sessionId = event.sessionId;
      if (!sessionId) {
        return true;
      }
      const session = await this.db.stream.get(sessionId, {
        useReplica: false,
      });
      if (!session) {
        return true;
      }
      if (session.partialSession) {
        // new session was started, so recording is not ready yet
        return true;
      }
    }

    const { data: webhooks } = await this.db.webhook.listSubscribed(
      event.userId,
      event.event
    );

    console.log(
      `fetched webhooks. userId=${event.userId} event=${event.event} webhooks=`,
      webhooks
    );
    if (webhooks.length === 0) {
      return true;
    }

    let stream = await this.db.stream.get(event.streamId, {
      useReplica: false,
    });
    if (!stream) {
      // if stream isn't found. don't fire the webhook, log an error
      throw new Error(
        `webhook Cannon: onTrigger: Stream Not found , streamId: ${event.streamId}`
      );
    }
    // basic sanitization.
    let sanitized = this.db.stream.addDefaultFields(
      this.db.stream.removePrivateFields({ ...stream })
    );
    delete sanitized.streamKey;

    let user = await this.db.user.get(event.userId);
    if (!user || user.suspended) {
      // if user isn't found. don't fire the webhook, log an error
      throw new Error(
        `webhook Cannon: onTrigger: User Not found , userId: ${event.userId}`
      );
    }

    try {
      const baseTrigger = {
        type: "webhook_trigger" as const,
        timestamp: Date.now(),
        streamId: event.streamId,
        event,
        stream: sanitized,
        user,
      };
      await Promise.all(
        webhooks.map((webhook) =>
          this.queue.publishWebhook("webhooks.triggers", {
            ...baseTrigger,
            id: uuid(),
            webhook,
          })
        )
      );
    } catch (error) {
      console.log("Error publish webhook trigger message: ", error);
      return false; // nack to retry processing the event
    }
    return true;
  }

  async handleWebhookQueue(data: ConsumeMessage) {
    let trigger: messages.WebhookTrigger;
    try {
      trigger = JSON.parse(data.content.toString());
      console.log("webhookCannon: got trigger message", trigger);
    } catch (err) {
      console.log("webhookCannon: error parsing message", err);
      this.queue.ack(data);
      return;
    }
    try {
      // TODO Activate URL Verification
      await this._fireHook(trigger, false);
    } catch (err) {
      console.log("_fireHook error", err);
      await this.retry(trigger);
    } finally {
      this.queue.ack(data);
    }
  }

  // async processEvent(msg: Notification) {
  //   console.log("EVENT TRIGGERED ON THE WEBHOOK");
  //   let event = await this.db.queue.pop(this.onTrigger.bind(this));
  //   console.log("event: ", event);
  // }

  stop() {
    // this.db.queue.unsetMsgHandler();
    this.running = false;
  }

  disableUrlVerify() {
    this.verifyUrls = false;
  }

  public calcBackoff = (lastInterval?: number): number => {
    if (!lastInterval || lastInterval < 1000) {
      lastInterval = 5000;
    }
    let newInterval = lastInterval * BACKOFF_COEF;
    if (newInterval > MAX_BACKOFF) {
      return lastInterval;
    }
    // RabbitMQ expects integer
    return newInterval | 0;
  };

  retry(trigger: messages.WebhookTrigger) {
    if (trigger?.retries >= MAX_RETRIES) {
      console.log(
        `Webhook Cannon| Max Retries Reached, id: ${trigger.id}, streamId: ${trigger.stream?.id}`
      );
      return;
    }

    trigger = {
      ...trigger,
      id: uuid(),
      timestamp: Date.now(),
      lastInterval: this.calcBackoff(trigger.lastInterval),
      retries: trigger.retries ? trigger.retries + 1 : 1,
    };
    return this.queue.delayedPublishWebhook(
      "webhooks.delayedEmits",
      trigger,
      trigger.lastInterval
    );
  }

  async _fireHook(trigger: messages.WebhookTrigger, verifyUrl = true) {
    const { event, webhook, stream: sanitized, user } = trigger;
    if (!event || !webhook || !sanitized || !user) {
      console.error(
        `invalid webhook trigger message received. type=${trigger.type} message=`,
        trigger
      );
      return;
    }
    console.log(`trying webhook ${webhook.name}: ${webhook.url}`);
    let ips, urlObj, isLocal;
    if (verifyUrl) {
      try {
        urlObj = parseUrl(webhook.url);
        if (urlObj.host) {
          ips = await this.resolver.resolve4(urlObj.hostname);
        }
      } catch (e) {
        console.error("error: ", e);
        throw e;
      }
    }

    // This is mainly useful for local testing
    if (user.admin || verifyUrl === false) {
      isLocal = false;
    } else {
      try {
        if (ips && ips.length) {
          isLocal = isLocalIP(ips[0]);
        } else {
          isLocal = true;
        }
      } catch (e) {
        console.error("isLocal Error", isLocal, e);
        throw e;
      }
    }
    if (isLocal) {
      // don't fire this webhook.
      console.log(
        `webhook ${webhook.id} resolved to a localIP, url: ${webhook.url}, resolved IP: ${ips}`
      );
    } else {
      console.log("preparing to fire webhook ", webhook.url);
      const timestamp = Date.now();
      // go ahead
      let params = {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": "livepeer.com",
        },
        timeout: WEBHOOK_TIMEOUT,
        body: JSON.stringify({
          id: event.id, // allows receiver to check if they have already processed the same event (possible when retrying)
          webhookId: webhook.id,
          createdAt: event.timestamp, // allows receiver to know how long ago event was emitted
          timestamp,
          event: event.event,
          stream: sanitized,
          payload: event.payload,
        }),
      };

      // sign payload if there is a webhook secret
      if (webhook.sharedSecret) {
        let signature = sign(params.body, webhook.sharedSecret);
        params.headers["Livepeer-Signature"] = `t=${timestamp},v1=${signature}`;
      }

      try {
        logger.info(`webhook ${webhook.id} firing`);
        const startTime = process.hrtime();
        let resp = await fetchWithTimeout(webhook.url, params);
        await this.storeResponse(webhook, event, resp, startTime);
        if (resp.status >= 200 && resp.status < 300) {
          // 2xx requests are cool. all is good
          logger.info(`webhook ${webhook.id} fired successfully`);
          return true;
        }

        if (resp.status >= 500) {
          await this.retry(trigger);
        }

        console.error(
          `webhook ${webhook.id} didn't get 200 back! response status: ${resp.status}`
        );
        // we don't retry on non 400 responses. only on timeouts
        // this.retry(event);
        return;
      } catch (e) {
        console.log("firing error", e);
        await this.retry(trigger);
        return;
      }
    }
  }

  async storeResponse(
    webhook: DBWebhook,
    event: messages.WebhookEvent,
    resp: Response,
    startTime: [number, number]
  ) {
    const hrDuration = process.hrtime(startTime);
    await this.db.webhookResponse.create({
      id: uuid(),
      webhookId: webhook.id,
      eventId: event.id,
      createdAt: Date.now(),
      duration: hrDuration[0] + hrDuration[1] / 1e9,
      statusCode: resp.status,
      response: {
        body: await resp.text(),
        headers: resp.headers.raw(),
        redirected: resp.redirected,
        status: resp.status,
        statusText: resp.statusText,
      },
    });
  }
}
