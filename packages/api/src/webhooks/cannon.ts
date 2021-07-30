import { DB } from "../store/db";
import { User, Stream } from "../schema/types";
import MessageQueue from "../store/rabbit-queue";
// import { getWebhooks } from "../controllers/helpers";
import Model from "../store/model";
import { DBWebhook, EventKey } from "../store/webhook-table";
import { fetchWithTimeout } from "../util";
import logger from "../logger";
import { sign } from "../controllers/helpers";

import uuid from "uuid/v4";
import { parse as parseUrl } from "url";
import { ConsumeMessage } from "amqplib";
import { Response } from "node-fetch";
const isLocalIP = require("is-local-ip");
const { Resolver } = require("dns").promises;
// const resolver = new Resolver();

const WEBHOOK_TIMEOUT = 5 * 1000;
const MAX_BACKOFF = 10 * 60 * 1000;
const BACKOFF_COEF = 1.2;
const MAX_RETRIES = 20;

export interface TPayload {
  [key: string]: any;
}
export interface WebhookMessage {
  id: string;
  event: EventKey;
  createdAt: number;
  userId: string;
  streamId: string;
  payload?: TPayload;
  retries?: number;
  lastInterval?: number;
  status?: string;
}

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
    this.resolver = new Resolver();
    this.queue = queue;
    // this.start();
  }

  async start() {
    console.log("WEBHOOK CANNON STARTED");
    await this.queue.consume(this.handleQueueMsg.bind(this));
  }

  async handleQueueMsg(data: ConsumeMessage) {
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
      await this.onTrigger(message);
    } catch (err) {
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

  retry(event: WebhookMessage) {
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
    this.queue.delayedEmit(event, event.lastInterval);
  }

  async _fireHook(
    event: WebhookMessage,
    webhook: DBWebhook,
    sanitized: Stream,
    user: User,
    verifyUrl = true
  ) {
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
        let resp = await fetchWithTimeout(webhook.url, params);
        if (resp.status >= 200 && resp.status < 300) {
          // 2xx requests are cool.
          // all is good
          logger.info(`webhook ${webhook.id} fired successfully`);
          await this.storeResponse(webhook, event, resp);
          return true;
        }

        if (resp.status >= 500) {
          this.retry(event);
        }

        console.error(
          `webhook ${webhook.id} didn't get 200 back! response status: ${resp.status}`
        );
        await this.storeResponse(webhook, event, resp);
        // we don't retry on non 200 responses. only on timeouts
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
    event: WebhookMessage,
    resp: Response,
    duration = 0
  ) {
    await this.db.webhookResponse.create({
      id: uuid(),
      webhookId: webhook.id,
      eventId: event.id,
      statusCode: resp.status,
      response: resp,
    });
  }

  async onTrigger(event: WebhookMessage) {
    console.log("ON TRIGGER triggered", event);
    if (!event) {
      // throw new Error('onTrigger requires a Queue event!')
      // this is fine because pop could return a null if some other client raced and picked the task
      // faster when it got the NOTIFY call.
      return;
    }
    const since = Date.now() - event.createdAt;

    if (event.event === "recording.ready") {
      if (!event.payload.sessionId) {
        return;
      }
      const session = await this.db.stream.get(event.payload.sessionId, {
        useReplica: false,
      });
      if (!session) {
        return;
      }
      if (session.partialSession) {
        // new session was started, so recording is not ready yet
        return;
      }
      delete event.payload.sessionId;
    }

    const { data: webhooksList } = await this.db.webhook.listSubscribed(
      event.userId,
      event.event
    );

    console.log("webhooks : ", webhooksList);
    let stream = await this.db.stream.get(event.streamId);
    if (!stream) {
      // if stream isn't found. don't fire the webhook, log an error
      return console.error(
        `webhook Cannon: onTrigger: Stream Not found , streamId: ${event.streamId}`
      );
    }
    // basic sanitization.
    let sanitized = this.db.stream.addDefaultFields(
      this.db.stream.removePrivateFields({ ...stream })
    );
    delete sanitized.streamKey;

    let user = await this.db.user.get(event.userId);
    if (!user) {
      // if user isn't found. don't fire the webhook, log an error
      return console.error(
        `webhook Cannon: onTrigger: User Not found , userId: ${event.userId}`
      );
    }

    try {
      const responses = await Promise.all(
        webhooksList.map(async (webhook, key) => {
          try {
            await this._fireHook(event, webhook, sanitized, user, false);
          } catch (error) {
            console.log("_fireHook Error", error);
          }
        })
      );
      // this version doesn't have blocking webhooks
      // if (responses.some((o) => !o)) {
      //   // at least one of responses is false, blocking this stream
      //   res.status(403);
      //   return res.end();
      // }
    } catch (e) {
      console.error("webhook loop error", e);
      throw e;
    }
  }
}
