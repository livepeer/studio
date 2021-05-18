import { DB } from "../store/db";
import { Queue } from "../schema/types";
import { getWebhooks } from "../controllers/helpers";
import Model from "../store/model";
import { fetchWithTimeout } from "../util";
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
  constructor({ db, store }) {
    this.db = db;
    this.store = store;
    this.start();
  }

  async start() {
    while (true) {
      let event = this.db.queue.pop();
      try {
        await this.onTrigger(event);
      } catch (e) {
        console.error("webhook loop error", e);
      }
    }
  }

  stop() {}

  calcBackoff(lastInterval): number {
    let newInterval = lastInterval * BACKOFF_COEF;
    if (newInterval > MAX_BACKOFF) {
      return lastInterval;
    }
    return newInterval;
  }

  retry(event) {
    event.lastInterval = this.calcBackoff(event.lastInterval);
    event.status = "pending";
    event.reteries = event.reteries ? event.reteries + 1 : 1;
    this.db.queue.updateMsg(event);
  }

  async onTrigger(event: Queue) {
    if (!event) {
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

    let user = await this.store.get(`user/${event.userId}`);

    try {
      const responses = await Promise.all(
        webhooksList.map(async (webhook, key) => {
          // console.log('webhook: ', webhook)
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
              let resp = await fetchWithTimeout(webhook.url, params);
              if (resp.status >= 200 && resp.status < 300) {
                // 2xx requests are cool.
                // all is good
                logger.info(`webhook ${webhook.id} fired successfully`);
                return true;
              }
              console.error(
                `webhook ${webhook.id} didn't get 200 back! response status: ${resp.status}`
              );
              // return !webhook.blocking;
            } catch (e) {
              console.log("firing error", e);
              // return !webhook.blocking;
            }
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
