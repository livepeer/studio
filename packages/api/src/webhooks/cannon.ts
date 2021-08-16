import { ConsumeMessage } from "amqplib";
import { promises as dns } from "dns";
import isLocalIP from "is-local-ip";
import { Response } from "node-fetch";
import { v4 as uuid } from "uuid";
import { parse as parseUrl } from "url";

import messages from "../store/messages";
import { DB } from "../store/db";
import { User, Stream } from "../schema/types";
import MessageQueue from "../store/rabbit-queue";
import Model from "../store/model";
import { DBWebhook, EventKey } from "../store/webhook-table";
import { fetchWithTimeout } from "../util";
import logger from "../logger";
import { sign } from "../controllers/helpers";
// const resolver = new Resolver();

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
  queue: MessageQueue;
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
    let message;
    try {
      message = JSON.parse(data.content.toString());
      console.log("events: got message", message);
    } catch (err) {
      console.log("events: error parsing message", err);
      this.queue.ack(data);
      return;
    }
    let event: messages.WebhookEvent = message;

    if (event.event === "recording.ready") {
      if (!event.payload.sessionId) {
        this.queue.ack(data);
        return;
      }
      const session = await this.db.stream.get(event.payload.sessionId, {
        useReplica: false,
      });
      if (!session) {
        this.queue.ack(data);
        return;
      }
      if (session.partialSession) {
        // new session was started, so recording is not ready yet
        this.queue.ack(data);
        return;
      }
      delete event.payload.sessionId;
    }

    try {
      const { data: webhooksList } = await this.db.webhook.listSubscribed(
        event.userId,
        event.event
      );

      console.log("webhooks : ", webhooksList);
      let stream = await this.db.stream.get(event.streamId);
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

      const responses = await Promise.all(
        webhooksList.map(async (webhook, key) => {
          try {
            await this.queue.publish("webhooks.triggers", {
              id: uuid(),
              event: event,
              stream: sanitized,
              user,
              webhook,
            });
          } catch (error) {
            console.log("Error firing single url webhook trigger", error);
            setTimeout(() => this.queue.nack(data), 1000);
            return;
          }
        })
      );
    } catch (err) {
      console.log("handleEventQueue Error ", err);
    }

    this.queue.ack(data);
  }

  async handleWebhookQueue(data: ConsumeMessage) {
    let message;
    try {
      message = JSON.parse(data.content.toString());
      console.log("webhookCannon: got message", message);
    } catch (err) {
      console.log("webhookCannon: error parsing message", err);
      this.queue.ack(data);
      return;
    }
    try {
      // TODO Activate URL Verification
      if (message.event && message.webhook && message.stream && message.user) {
        await this._fireHook(
          message.event,
          message.webhook,
          message.stream,
          message.user,
          false
        );
      }
    } catch (err) {
      console.log("_fireHook error", err);
      this.retry(message);
    }

    this.queue.ack(data);
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

  calcBackoff(lastInterval): number {
    if (!lastInterval || lastInterval < 1000) {
      lastInterval = 5000;
    }
    let newInterval = lastInterval * BACKOFF_COEF;
    if (newInterval > MAX_BACKOFF) {
      return lastInterval;
    }
    // RabbitMQ expects integer
    return newInterval | 0;
  }

  retry(event: messages.WebhookEvent) {
    if (event && event.retries && event.retries >= MAX_RETRIES) {
      console.log(
        `Webhook Cannon| Max Retries Reached, id: ${event.id}, streamId: ${event.streamId}`
      );
      return;
    }

    event = {
      ...event,
      lastInterval: this.calcBackoff(event.lastInterval),
      status: "pending",
      retries: event.retries ? event.retries + 1 : 1,
    };
    this.queue.delayedPublish(
      "webhooks.delayedEmits",
      event,
      event.lastInterval
    );
  }

  async _fireHook(
    event: messages.WebhookEvent,
    webhook: DBWebhook,
    sanitized: Stream,
    user: User,
    verifyUrl = true
  ) {
    if (!event || !webhook || !sanitized || !user) {
      throw new Error(
        `_firehook Error: event, webhook, sanitized and user are required`
      );
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
          id: event.id, // this will allow receiver to check if it is already received same hook
          // (possible when retrying)
          webhookId: webhook.id,
          createdAt: event.createdAt, // that way receiver will know how long ago event was emitted
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
          this.retry(event);
        }

        console.error(
          `webhook ${webhook.id} didn't get 200 back! response status: ${resp.status}`
        );
        // we don't retry on non 400 responses. only on timeouts
        // this.retry(event);
        return;
      } catch (e) {
        console.log("firing error", e);
        this.retry(event);
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
