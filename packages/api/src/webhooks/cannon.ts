import { DB } from "../store/db";
import { Queue, Webhook, User, Stream } from "../schema/types";
import { getWebhooks } from "../controllers/helpers";
import Model from "../store/model";
import { fetchWithTimeout, fetchWithTimeoutAndSleep } from "../util";
import logger from "../logger";

import { parse as parseUrl } from "url";
const isLocalIP = require("is-local-ip");
const { Resolver } = require("dns").promises;
const resolver = new Resolver();

const WEBHOOK_TIMEOUT = 5 * 1000;
const MAX_BACKOFF = 10 * 60 * 1000;
const BACKOFF_COEF = 1.2;

export default class WebhookCannon {
  db: DB;
  store: Model;
  running: boolean;
  constructor({ db, store }) {
    this.db = db;
    this.store = store;
    this.running = true;
    this.start();
  }

  async start() {
    if (this.running) {
      this.db.queue.setMsgHandler(this.processEvent.bind(this));
    }
  }

  async processEvent(msg: Notification) {
    let event = await this.db.queue.pop(this.onTrigger.bind(this));
  }

  stop() {
    this.db.queue.unsetMsgHandler();
    this.running = false;
  }

  calcBackoff(lastInterval): number {
    if (!lastInterval || lastInterval < 1000) {
      lastInterval = 5000;
    }
    let newInterval = lastInterval * BACKOFF_COEF;
    if (newInterval > MAX_BACKOFF) {
      return lastInterval;
    }
    return newInterval;
  }

  retry(event) {
    event.lastInterval = this.calcBackoff(event.lastInterval);
    event.status = "pending";
    event.retries = event.retries ? event.retries + 1 : 1;
    this.db.queue.updateMsg(event);
  }

  async _fireHook(
    event: Queue,
    webhook: Webhook,
    sanitized: Stream,
    user: User
  ) {
    console.log(`trying webhook ${webhook.name}: ${webhook.url}`);
    let ips, urlObj, isLocal;
    try {
      urlObj = parseUrl(webhook.url);
      if (urlObj.host) {
        ips = await resolver.resolve4(urlObj.hostname);
      }
    } catch (e) {
      console.error("error: ", e);
      throw e;
    }

    // This is mainly useful for local testing
    if (user.admin) {
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
      // go ahead
      let params = {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": "livepeer.com",
        },
        timeout: WEBHOOK_TIMEOUT,
        body: JSON.stringify({
          id: webhook.id,
          event: webhook.event,
          stream: sanitized,
        }),
      };

      try {
        logger.info(`webhook ${webhook.id} firing`);
        let resp = await fetchWithTimeoutAndSleep(
          webhook.url,
          params,
          event.lastInterval
        );
        if (resp.status >= 200 && resp.status < 300) {
          // 2xx requests are cool.
          // all is good
          logger.info(`webhook ${webhook.id} fired successfully`);
          await this.storeResponse(webhook, event, resp);
          return true;
        }
        console.error(
          `webhook ${webhook.id} didn't get 200 back! response status: ${resp.status}`
        );
        await this.storeResponse(webhook, event, resp);
        // retry
        this.retry(event);
        return;
        // return !webhook.blocking;
      } catch (e) {
        console.log("firing error", e);
        // return !webhook.blocking;
        return;
      }
    }
  }

  async storeResponse(
    webhook: Webhook,
    event: Queue,
    resp: Response,
    duration = 0
  ) {
    // TODO
    // store response for each time a webhook fires.
    await this.db.webhookResponse.create({
      webhookId: webhook.id,
      eventId: event.id,
      statusCode: resp.status,
      response: resp,
    });
  }

  async onTrigger(event: Queue) {
    if (!event) {
      // throw new Error('onTrigger requires a Queue event!')
      // this is fine because pop could return a null if some other client raced and picked the task
      // faster when it got the NOTIFY call.
      return;
    }

    const { data: webhooksList } = await getWebhooks(
      this.store,
      event.userId,
      event.event
    );

    let stream = await this.db.stream.get(event.streamId);
    // basic sanitization.
    let sanitized = { ...stream };
    delete sanitized.streamKey;

    let user = await this.db.user.get(`user/${event.userId}`);
    if (!user) {
      // if user isn't found. don't fire the webhook, log an error
      throw new Error(
        `webhook Cannon: onTrigger: User Not found , userId: ${event.userId}`
      );
    }

    try {
      const responses = await Promise.all(
        webhooksList.map(async (webhook, key) => {
          try {
            await this._fireHook(event, webhook, sanitized, user);
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
