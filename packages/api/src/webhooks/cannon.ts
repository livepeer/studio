import { ConsumeMessage } from "amqplib";
import { isIP } from "net";
import dns from "dns";
import isLocalIP from "is-local-ip";
import _ from "lodash";
import { Response } from "node-fetch";
import { parse as parseUrl } from "url";
import { v4 as uuid } from "uuid";
import { createAsset, primaryStorageExperiment } from "../controllers/asset";
import { generateUniquePlaybackId } from "../controllers/generate-keys";
import { sendgridEmail, sign } from "../controllers/helpers";
import { buildRecordingUrl } from "../controllers/session";
import { USER_SESSION_TIMEOUT } from "../controllers/stream";
import logger from "../logger";
import { WebhookLog } from "../schema/types";
import { jobsDb as db } from "../store"; // use only the jobs DB pool on queue logic
import { BadRequestError, UnprocessableEntityError } from "../store/errors";
import { isExperimentSubject } from "../store/experiment-table";
import messages from "../store/messages";
import Queue from "../store/queue";
import { DBSession } from "../store/session-table";
import { DBStream } from "../store/stream-table";
import { DBWebhook } from "../store/webhook-table";
import { taskScheduler } from "../task/scheduler";
import { RequestInitWithTimeout, fetchWithTimeout, sleep } from "../util";

const WEBHOOK_TIMEOUT = 30 * 1000;
const MAX_BACKOFF = 60 * 60 * 1000;
const BACKOFF_COEF = 2;
const MAX_RETRIES = 33;

const SIGNATURE_HEADER = "Livepeer-Signature";

function isRuntimeError(err: any): boolean {
  const runtimeErrors: ErrorConstructor[] = [
    TypeError,
    ReferenceError,
    RangeError,
    SyntaxError,
  ];
  return runtimeErrors.some((re) => err instanceof re);
}

export default class WebhookCannon {
  running: boolean;
  skipUrlVerification: boolean;
  frontendDomain: string;
  sendgridTemplateId: string;
  sendgridApiKey: string;
  supportAddr: [string, string];
  vodCatalystObjectStoreId: string;
  secondaryVodObjectStoreId: string;
  recordCatalystObjectStoreId: string;
  secondaryRecordObjectStoreId: string;
  resolver: dns.promises.Resolver;
  queue: Queue;
  constructor({
    frontendDomain,
    sendgridTemplateId,
    sendgridApiKey,
    supportAddr,
    vodCatalystObjectStoreId,
    secondaryVodObjectStoreId,
    recordCatalystObjectStoreId,
    secondaryRecordObjectStoreId,
    skipUrlVerification,
    queue,
  }) {
    this.running = true;
    this.skipUrlVerification = skipUrlVerification;
    this.frontendDomain = frontendDomain;
    this.sendgridTemplateId = sendgridTemplateId;
    this.sendgridApiKey = sendgridApiKey;
    this.supportAddr = supportAddr;
    this.vodCatalystObjectStoreId = vodCatalystObjectStoreId;
    this.secondaryVodObjectStoreId = secondaryVodObjectStoreId;
    this.recordCatalystObjectStoreId = recordCatalystObjectStoreId;
    this.secondaryRecordObjectStoreId = secondaryRecordObjectStoreId;
    this.resolver = new dns.promises.Resolver();
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
      ack = isRuntimeError(err);
      console.log("handleEventQueue Error ", err);
    } finally {
      if (ack) {
        this.queue.ack(data);
      } else {
        setTimeout(() => this.queue.nack(data), 1000);
      }
    }
  }

  async processWebhookEvent(msg: messages.WebhookEvent): Promise<boolean> {
    const { event, streamId, sessionId, userId } = msg;

    if (event === "playback.accessControl") {
      // Cannot fire this event as a webhook, this is specific to access control and fired there
      return true;
    }

    if (event === "recording.waiting" && sessionId) {
      try {
        await this.handleRecordingWaitingChecks(sessionId);
      } catch (e) {
        console.log(
          `Error handling recording.waiting event sessionId=${sessionId} err=`,
          e
        );
        // only ack the event if it's an explicit unprocessable entity error
        if (e instanceof UnprocessableEntityError) {
          return true;
        }
        throw e;
      }
    }

    const { data: webhooks } = await db.webhook.listSubscribed(userId, event);

    console.log(
      `fetched webhooks. userId=${userId} event=${event} webhooks=`,
      webhooks
    );
    if (webhooks.length === 0) {
      return true;
    }

    let stream: DBStream | undefined;
    if (streamId) {
      stream = await db.stream.get(streamId, {
        useReplica: false,
      });
      if (!stream) {
        // if stream isn't found. don't fire the webhook, log an error
        throw new Error(
          `webhook Cannon: onTrigger: Stream Not found , streamId: ${streamId}`
        );
      }
      // basic sanitization.
      stream = db.stream.addDefaultFields(
        db.stream.removePrivateFields({ ...stream })
      );
      delete stream.streamKey;
    }

    let user = await db.user.get(userId);
    if (!user || user.suspended) {
      // if user isn't found. don't fire the webhook, log an error
      throw new Error(
        `webhook Cannon: onTrigger: User Not found , userId: ${userId}`
      );
    }

    try {
      const baseTrigger = {
        type: "webhook_trigger" as const,
        timestamp: Date.now(),
        streamId,
        event: msg,
        stream,
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
      await this._fireHook(trigger);
    } catch (err) {
      console.log("_fireHook error", err);
      await this.retry(trigger, null, err);
    } finally {
      this.queue.ack(data);
    }
  }

  stop() {
    // this.db.queue.unsetMsgHandler();
    this.running = false;
  }

  public calcBackoff = (lastInterval?: number): number => {
    if (!lastInterval || lastInterval < 1000) {
      return 5000;
    }
    let newInterval = lastInterval * BACKOFF_COEF;
    if (newInterval > MAX_BACKOFF) {
      return MAX_BACKOFF;
    }
    // RabbitMQ expects integer
    return newInterval | 0;
  };

  retry(
    trigger: messages.WebhookTrigger,
    webhookPayload?: RequestInitWithTimeout,
    err?: Error
  ) {
    if (trigger?.retries >= MAX_RETRIES) {
      console.log(
        `Webhook Cannon| Max Retries Reached, id: ${trigger.id}, streamId: ${trigger.stream?.id}`
      );
      try {
        trigger = webhookFailNotification(trigger, webhookPayload, err);
      } catch (err) {
        console.error(
          `Webhook Cannon| Error sending notification email to user, id: ${trigger.id}, streamId: ${trigger.stream?.id}`
        );
      }
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

  async notifyFailedWebhook(
    trigger: messages.WebhookTrigger,
    params?: RequestInitWithTimeout,
    err?: any
  ) {
    if (!trigger.user.emailValid) {
      console.error(
        `Webhook Cannon| User email is not valid, id: ${trigger.id}, streamId: ${trigger.stream?.id}`
      );
      return;
    }
    if (!(this.supportAddr && this.sendgridTemplateId && this.sendgridApiKey)) {
      console.error(
        `Webhook Cannon| Unable to send notification email to user, id: ${trigger.id}, streamId: ${trigger.stream?.id}`
      );
      console.error(
        `Sending emails requires supportAddr, sendgridTemplateId, and sendgridApiKey`
      );
      return;
    }

    let signatureHeader = "";
    if (params.headers[SIGNATURE_HEADER]) {
      signatureHeader = `-H  "${SIGNATURE_HEADER}: ${params.headers[SIGNATURE_HEADER]}"`;
    }

    let payload = params.body;

    await sendgridEmail({
      email: trigger.user.email,
      supportAddr: this.supportAddr,
      sendgridTemplateId: this.sendgridTemplateId,
      sendgridApiKey: this.sendgridApiKey,
      subject: "Your webhook is failing",
      preheader: "Failure notification",
      buttonText: "Manage your webhooks",
      buttonUrl: `https://${this.frontendDomain}/dashboard/developers/webhooks`,
      unsubscribe: `https://${this.frontendDomain}/contact`,
      text: [
        `Your webhook ${trigger.webhook.name} with url ${trigger.webhook.url} failed to receive our payload in the last 24 hours`,
        //`<code>${payload}</code>`,
        `This is the error we are receiving:`,
        `${err}`,
        //`We disabled your webhook, please check your configuration and try again.`,
        //`If you want to try yourself the call we are making, here is a curl command for that:`,
        //`<code>curl -X POST -H "Content-Type: application/json" -H "user-agent: livepeer.studio" ${signatureHeader} -d '${payload}' ${trigger.webhook.url}</code>`,

        // TODO: Uncomment the additional information here once we get access to Sendgrid to change the tempalte
      ].join("\n\n"),
    });

    console.log(
      `Webhook Cannon| Email sent to user="${trigger.user.email}" id=${trigger.id} streamId=${trigger.stream?.id}`
    );
  }

  async _fireHook(trigger: messages.WebhookTrigger) {
    const { event, webhook, stream, user } = trigger;
    if (!event || !webhook || !user) {
      console.error(
        `invalid webhook trigger message received. type=${trigger.type} message=`,
        trigger
      );
      return;
    }
    console.log(`trying webhook ${webhook.name}: ${webhook.url}`);

    const { ips, isLocal } = await this.checkIsLocalIp(
      webhook.url,
      user.admin
    ).catch((e) => {
      console.error("error checking if is local IP: ", e);
      return { ips: [], isLocal: false };
    });

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
          "user-agent": "livepeer.studio",
        },
        timeout: WEBHOOK_TIMEOUT,
        body: JSON.stringify({
          id: event.id, // allows receiver to check if they have already processed the same event (possible when retrying)
          webhookId: webhook.id,
          createdAt: event.timestamp, // allows receiver to know how long ago event was emitted
          timestamp,
          event: event.event,
          stream,
          payload: event.payload,
        }),
      };

      const sigHeaders = signatureHeaders(
        params.body,
        webhook.sharedSecret,
        timestamp
      );
      params.headers = { ...params.headers, ...sigHeaders };

      const triggerTime = Date.now();
      const startTime = process.hrtime();
      let resp: Response;
      let errorMessage: string;
      let responseBody: string;
      let statusCode: number;

      try {
        logger.info(`webhook ${webhook.id} firing`);
        resp = await fetchWithTimeout(webhook.url, params);
        responseBody = await resp.text();
        statusCode = resp.status;

        if (isSuccess(resp)) {
          // 2xx requests are cool. all is good
          logger.info(`webhook ${webhook.id} fired successfully`);
          return true;
        }
        if (resp.status >= 500) {
          await this.retry(
            trigger,
            params,
            new Error("Status code: " + resp.status)
          );
        }

        console.error(
          `webhook ${webhook.id} didn't get 200 back! response status: ${resp.status}`
        );
        // we don't retry on non 400 responses. only on timeouts
        // this.retry(event);
      } catch (e) {
        console.log("firing error", e);
        errorMessage = e.message;
        await this.retry(trigger, params, e);
      } finally {
        try {
          await storeResponse(
            webhook,
            event.id,
            event.event,
            resp,
            startTime,
            responseBody,
            webhook.sharedSecret,
            params
          );
        } catch (e) {
          console.log(
            `Unable to store response of webhook ${webhook.id} url: ${webhook.url} error: ${e}`
          );
        }
        await this.storeTriggerStatus(
          trigger.webhook,
          triggerTime,
          statusCode,
          errorMessage,
          responseBody
        );
        return;
      }
    }
  }

  public async checkIsLocalIp(url: string, isAdmin: boolean) {
    if (isAdmin || this.skipUrlVerification) {
      // this is mainly useful for local testing
      return { ips: [], isLocal: false };
    }

    const emptyIfNotFound = (err) => {
      if ([dns.NODATA, dns.NOTFOUND, dns.BADFAMILY].includes(err.code)) {
        return [] as string[];
      }
      throw err;
    };

    const { hostname } = parseUrl(url);
    if (["localhost", "ip6-localhost", "ip6-loopback"].includes(hostname)) {
      // dns.resolve functions do not take /etc/hosts into account, so we need to handle these separately
      const ips = hostname === "localhost" ? ["127.0.0.1"] : ["::1"];
      return { ips, isLocal: true };
    }

    const ips = isIP(hostname)
      ? [hostname]
      : await Promise.all([
          this.resolver.resolve4(hostname).catch(emptyIfNotFound),
          this.resolver.resolve6(hostname).catch(emptyIfNotFound),
        ]).then((ipsArrs) => ipsArrs.flat());

    const isLocal = ips.some(isLocalIP);
    return { ips, isLocal };
  }

  async storeTriggerStatus(
    webhook: DBWebhook,
    triggerTime: number,
    statusCode: number,
    errorMessage: string,
    responseBody: string
  ) {
    await storeTriggerStatus(
      webhook,
      triggerTime,
      statusCode,
      errorMessage,
      responseBody
    );
  }

  async handleRecordingWaitingChecks(
    sessionId: string,
    attempt = 1
  ): Promise<void> {
    const session = await db.session.get(sessionId, {
      useReplica: false,
    });
    if (!session) {
      throw new UnprocessableEntityError("Session not found");
    }

    const [childStreams] = await db.stream.find({ sessionId });
    const lastSeen = _(childStreams)
      .concat(session)
      .map((s) => s.lastSeen || s.createdAt)
      .max();
    const hasSourceSegments = _(childStreams)
      .concat(session)
      .some((s) => !!s.sourceSegments);

    const activeThreshold = Date.now() - USER_SESSION_TIMEOUT;
    if (lastSeen > activeThreshold) {
      if (attempt >= 5) {
        throw new UnprocessableEntityError("Session is still active");
      }
      // there was an update after the delayed event was sent, so sleep a few secs
      // (up to 5s + USER_SESSION_TIMEOUT) and re-check if it actually stopped.
      await sleep(5000 + (lastSeen - activeThreshold));
      return this.handleRecordingWaitingChecks(sessionId, attempt + 1);
    }

    // if we got to this point, it means we're confident this session is inactive
    // and we can set the child streams isActive=false
    await Promise.all(
      childStreams.map((child) => {
        return db.stream.update(child.id, { isActive: false });
      })
    );

    if (!lastSeen && !hasSourceSegments) {
      logger.info(
        `Skipping unused session sessionId=${session.id} childStreamCount=${childStreams.length}`
      );
      return;
    }

    const res = await db.asset.get(sessionId);
    if (res) {
      throw new UnprocessableEntityError("Session recording already handled");
    }

    await this.recordingToVodAsset(session);
  }

  async recordingToVodAsset(session: DBSession) {
    const id = session.id;
    const playbackId = await generateUniquePlaybackId(id);

    const secondaryStorageEnabled = !(await isExperimentSubject(
      primaryStorageExperiment,
      session.userId
    ));
    const secondaryObjectStoreId =
      secondaryStorageEnabled && this.secondaryVodObjectStoreId;

    // trim the second precision from the time string
    var startedAt = new Date(session.createdAt).toISOString();
    startedAt = startedAt.substring(0, startedAt.length - 8) + "Z";

    try {
      const asset = await createAsset(
        {
          id,
          playbackId,
          userId: session.userId,
          createdAt: session.createdAt,
          source: { type: "recording", sessionId: session.id },
          status: { phase: "waiting", updatedAt: Date.now() },
          name: `live-${startedAt}`,
          objectStoreId:
            secondaryObjectStoreId || this.vodCatalystObjectStoreId,
        },
        this.queue
      );

      const { url } = await buildRecordingUrl(
        session,
        this.recordCatalystObjectStoreId,
        this.secondaryRecordObjectStoreId
      );

      await taskScheduler.createAndScheduleTask(
        "upload",
        {
          upload: {
            url: url,
            thumbnails: !(await isExperimentSubject(
              "vod-thumbs-off",
              session.userId
            )),
          },
        },
        undefined,
        asset
      );
    } catch (e) {
      if (e instanceof BadRequestError) {
        throw new UnprocessableEntityError(
          "Asset for the recording session already added"
        );
      } else {
        throw e;
      }
    }
  }
}

function isSuccess(resp: Response) {
  return resp?.status >= 200 && resp?.status < 300;
}

async function storeResponse(
  webhook: DBWebhook,
  eventId: string,
  eventName: string,
  resp: Response,
  startTime: [number, number],
  responseBody: string,
  sharedSecret: string,
  params
): Promise<WebhookLog> {
  const hrDuration = process.hrtime(startTime);
  let encodedResponseBody = "";
  if (responseBody) {
    encodedResponseBody = Buffer.from(responseBody.substring(0, 1024)).toString(
      "base64"
    );
  }

  const webhookLog = {
    id: uuid(),
    webhookId: webhook.id,
    eventId: eventId,
    event: eventName,
    userId: webhook.userId,
    createdAt: Date.now(),
    duration: hrDuration[0] + hrDuration[1] / 1e9,
    success: isSuccess(resp),
    response: {
      body: encodedResponseBody,
      redirected: resp?.redirected,
      status: resp?.status,
      statusText: resp?.statusText,
    },
    request: {
      url: webhook.url,
      body: params.body,
      method: params.method,
      headers: params.headers,
    },
    sharedSecret: sharedSecret,
  };
  await db.webhookLog.create(webhookLog);
  return webhookLog;
}

export async function resendWebhook(
  webhook: DBWebhook,
  webhookLog: WebhookLog
): Promise<WebhookLog> {
  const triggerTime = Date.now();
  const startTime = process.hrtime();
  let resp: Response;
  let responseBody: string;
  let statusCode: number;
  let errorMessage: string;
  try {
    const timestamp = Date.now();
    const requestBody = JSON.parse(webhookLog.request.body);
    webhookLog.request.body = JSON.stringify({
      ...requestBody,
      timestamp,
    });
    const sigHeaders = signatureHeaders(
      webhookLog.request.body,
      webhookLog.sharedSecret,
      timestamp
    );
    webhookLog.request.headers = {
      ...webhookLog.request.headers,
      ...sigHeaders,
    };

    resp = await fetchWithTimeout(webhookLog.request.url, {
      method: webhookLog.request.method,
      headers: webhookLog.request.headers,
      timeout: WEBHOOK_TIMEOUT,
      body: webhookLog.request.body,
    });
    responseBody = await resp.text();
    statusCode = resp.status;
  } catch (e) {
    console.log("firing error", e);
    errorMessage = e.message;
  } finally {
    await storeTriggerStatus(
      webhook,
      triggerTime,
      statusCode,
      errorMessage,
      responseBody
    );
    return await storeResponse(
      webhook,
      webhookLog.eventId,
      webhookLog.event,
      resp,
      startTime,
      responseBody,
      webhookLog.sharedSecret,
      webhookLog.request
    );
  }
}

export async function storeTriggerStatus(
  webhook: DBWebhook,
  triggerTime: number,
  statusCode?: number,
  errorMessage?: string,
  responseBody?: string
): Promise<void> {
  try {
    let status: DBWebhook["status"] = { lastTriggeredAt: triggerTime };
    let encodedResponseBody = responseBody
      ? Buffer.from(responseBody).toString("base64")
      : "";
    if (statusCode >= 300 || !statusCode) {
      status = {
        ...status,
        lastFailure: {
          timestamp: triggerTime,
          statusCode,
          error: errorMessage,
          response: encodedResponseBody,
        },
      };
    }
    await db.webhook.updateStatus(webhook.id, status);
  } catch (e) {
    console.log(
      `Unable to store status of webhook ${webhook.id} url: ${webhook.url}`
    );
  }
}

export function webhookFailNotification(
  trigger: messages.WebhookTrigger,
  webhookPayload: RequestInitWithTimeout,
  err: Error
): messages.WebhookTrigger {
  const lastFailureNotification = trigger?.lastFailureNotification;
  const currentTime = Date.now();
  if (
    !lastFailureNotification ||
    currentTime - lastFailureNotification > 24 * 60 * 60 * 1000
  ) {
    this.notifyFailedWebhook(trigger, webhookPayload, err);
  }

  trigger = {
    ...trigger,
    lastFailureNotification: currentTime,
  };

  return trigger;
}

export function signatureHeaders(
  payload: string,
  sharedSecret: string,
  timestamp: number
): { [key: string]: string } | {} {
  if (!sharedSecret) return {};
  let signature = sign(payload, sharedSecret);
  return { [SIGNATURE_HEADER]: `t=${timestamp},v1=${signature}` };
}
