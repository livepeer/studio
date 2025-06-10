import * as amqp from "amqp-connection-manager";
import { AmqpConnectionManager, ChannelWrapper } from "amqp-connection-manager";
import { Channel, ConsumeMessage } from "amqplib";
import messages from "./messages";
import { EventKey } from "./webhook-table";
import { sleep } from "../util";

export const defaultTaskExchange = "lp_tasks";

const getExchanges = (tasksExchange = defaultTaskExchange) =>
  ({
    webhooks: "webhook_default_exchange",
    task: tasksExchange,
  }) as const;
const getQueues = (tasksExchange = defaultTaskExchange) =>
  ({
    events: "webhook_events_queue_v1",
    webhooks: "webhook_cannon_single_url_v1",
    task: `${tasksExchange}_results`,
  }) as const;
const delayedWebhookQueue = (delayMs: number) => `delayed_webhook_${delayMs}ms`;

type Queues = ReturnType<typeof getQueues>;
type Exchanges = ReturnType<typeof getExchanges>;
type QueueName = keyof Queues;
type ExchangeName = keyof Exchanges;
export type RoutingKey =
  | `events.${EventKey}`
  | `webhooks.${string}`
  | `task.trigger.${string}.${string}`;

export default interface Queue {
  publish(
    exchange: ExchangeName,
    key: RoutingKey,
    msg: messages.Any,
  ): Promise<void>;
  publishWebhook(key: RoutingKey, msg: messages.Webhooks): Promise<void>;
  delayedPublishWebhook(
    key: RoutingKey,
    msg: messages.Any,
    delay: number,
    delayedQueueName?: string,
  ): Promise<void>;

  consume(name: QueueName, func: (msg: ConsumeMessage) => void): Promise<void>;
  ack(data: any): void;
  nack(data: any): void;

  close(): Promise<void>;
}

export class NoopQueue implements Queue {
  async publish(
    exchange: ExchangeName,
    key: RoutingKey,
    msg: messages.Webhooks,
  ) {
    console.warn(
      `WARN: Publish to exchange=${exchange} on noop queue. key=${key} message=`,
      msg,
    );
  }

  async publishWebhook(key: RoutingKey, msg: messages.Webhooks) {
    this.publish("webhooks", key, msg);
  }

  async delayedPublishWebhook(
    key: RoutingKey,
    msg: messages.Any,
    delay: number,
  ) {
    console.warn(
      `WARN: Delayed publish event to noop queue. key=${key} delay=${delay} message=`,
      msg,
    );
  }

  async consume(_: QueueName, __: (_: ConsumeMessage) => void) {}
  ack(_: any) {}
  nack(_: any) {}

  async close() {}
}

export class RabbitQueue implements Queue {
  private readonly queues: Queues;
  private readonly exchanges: Exchanges;

  private channel: ChannelWrapper;
  private connection: AmqpConnectionManager;

  public static async connect(
    url: string,
    appName: string = "api",
    tasksExchange = defaultTaskExchange,
  ): Promise<RabbitQueue> {
    const queue = new RabbitQueue(tasksExchange);
    await queue.init(url, appName);
    return queue;
  }

  private constructor(tasksExchange = defaultTaskExchange) {
    this.queues = getQueues(tasksExchange);
    this.exchanges = getExchanges(tasksExchange);
  }

  private async init(url: string, appName: string): Promise<void> {
    // Create a new connection manager
    this.connection = amqp.connect([url], {
      connectionOptions: {
        clientProperties: { connection_name: appName },
      },
    });
    this.channel = this.connection.createChannel({
      json: true,
      publishTimeout: 60_000, // 60s
      setup: async (channel: Channel) => {
        await Promise.all([
          channel.assertQueue(this.queues.events, {
            arguments: { "x-queue-type": "quorum" },
          }),
          channel.assertQueue(this.queues.webhooks, {
            arguments: { "x-queue-type": "quorum" },
          }),
          channel.assertQueue(this.queues.task, {
            arguments: { "x-queue-type": "quorum" },
          }),
          channel.assertExchange(this.exchanges.webhooks, "topic", {
            durable: true,
          }),
          channel.assertExchange(this.exchanges.task, "topic", {
            durable: true,
          }),
        ]);
        await Promise.all([
          channel.bindQueue(
            this.queues.events,
            this.exchanges.webhooks,
            "events.#",
          ),
          channel.bindQueue(
            this.queues.webhooks,
            this.exchanges.webhooks,
            "webhooks.#",
          ),
          channel.bindQueue(
            this.queues.task,
            this.exchanges.task,
            "task.result.#",
          ),
          channel.bindQueue(
            this.queues.task,
            this.exchanges.task,
            "task.resultPartial.#",
          ),
        ]);
        await channel.prefetch(10);
      },
    });
    const connectPromise = new Promise<void>((resolve, reject) => {
      let resolveOnce = (err?: Error) => {
        if (!resolve) return;
        err ? reject(err) : resolve();
        resolve = null;
      };
      this.connection.on("connect", () => {
        console.log("AMQP Connected!");
        resolveOnce();
      });
      this.connection.on("connectFailed", (err: Error) => {
        console.log("AMQP Connect Failed.", err);
        resolveOnce(
          new Error(
            `Error connecting to RabbitMQ. ${err.name}: ${err.message}`,
          ),
        );
      });
      this.connection.on("disconnect", ({ err }: { err: Error }) => {
        console.log("AMQP Disconnected.", err);
        resolveOnce(
          new Error(`RabbitMQ disconnected. ${err.name}: ${err.message}`),
        );
      });
    });
    await Promise.all([connectPromise, this.channel.waitForConnect()]);
  }

  public async close(): Promise<void> {
    await this.channel.close();
    await this.connection.close();
  }

  public ack(data: any): void {
    this.channel.ack(data);
  }

  public nack(data: any): void {
    this.channel.nack(data);
  }

  public async consume(
    queueName: QueueName,
    func: (msg: ConsumeMessage) => void,
  ): Promise<void> {
    if (!func) {
      throw new Error("RabbitMQ | consume | func is undefined");
    }
    console.log("adding consumer");
    await this.channel.addSetup((channel: Channel) => {
      return channel.consume(this.queues[queueName], func);
    });
  }

  public handleMessage(data: any) {
    var message = data.content.toString();
    console.log(`subscriber: handling message msg=${message}`);
    this.ack(data);
  }

  public async publishWebhook(
    route: RoutingKey,
    msg: messages.Any,
  ): Promise<void> {
    await this.publish("webhooks", route, msg);
  }

  public async publish(
    exchangeName: ExchangeName,
    route: RoutingKey,
    msg: messages.Any,
  ): Promise<void> {
    console.log(
      `publishing message route=${route} exchange=${exchangeName} msg=${JSON.stringify(
        msg,
      )}`,
    );
    await this._channelPublish(this.exchanges[exchangeName], route, msg, {
      persistent: true,
      // TODO: Actually handle confirms and returns from the AMQP server. Needs to setup a `return` event handler in the channel.
      // mandatory: true,
    });
  }

  // This function publishes a message to an alternate exchange/queue used only
  // for delayed messages. Messages are published with an expiration equal to
  // the desired `delay` parameter, and after they expire are sent to the main
  // exchange through the delayed queue deadletterExchange configuration.
  public delayedPublishWebhook(
    routingKey: RoutingKey,
    msg: messages.Any,
    delay: number,
    delayedQueueName?: string,
  ): Promise<void> {
    delay = Math.round(delay);
    if (!delayedQueueName) {
      delayedQueueName = delayedWebhookQueue(delay);
    }

    // TODO: Find a way to reimplement this without on-demand queues.
    return this._withSetup(
      async (channel: Channel) => {
        await Promise.all([
          channel.assertExchange(delayedQueueName, "topic", {
            durable: true,
            autoDelete: true,
          }),
          channel.assertQueue(delayedQueueName, {
            durable: true,
            messageTtl: delay,
            deadLetterExchange: this.exchanges.webhooks,
            expires: delay + 15000,
          }),
        ]);
        await channel.bindQueue(delayedQueueName, delayedQueueName, "#");
      },
      () => {
        console.log(
          `emitting delayed message: delay=${
            delay / 1000
          }s queue=${delayedQueueName} msg=${JSON.stringify(msg)}`,
        );
        return this._channelPublish(delayedQueueName, routingKey, msg, {
          persistent: true,
        });
      },
    );
  }

  private async _withSetup<T>(
    setup: amqp.SetupFunc,
    action: () => Promise<T>,
  ): Promise<T> {
    await this.channel.addSetup(setup);
    try {
      return await action();
    } finally {
      // avoid accumulating duplicate setup funcs on the channel manager
      await this.channel.removeSetup(setup, () => {});
    }
  }

  private async _channelPublish(
    exchange: string,
    routingKey: string,
    msg: any,
    opts: amqp.Options.Publish,
  ) {
    const maxRetries = 3;
    const delayMs = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const success = await this.channel.publish(
          exchange,
          routingKey,
          msg,
          opts,
        );
        if (!success) {
          throw new Error(
            `Failed to publish message ${routingKey}: publish buffer full`,
          );
        }
        return;
      } catch (err) {
        console.error(
          `Error publishing message: exchange="${exchange}" routingKey="${routingKey}" attempt="${attempt}" err=`,
          err,
        );
        if (attempt < maxRetries) {
          await sleep(delayMs);
        } else {
          if (err?.message?.includes("timeout")) {
            throw new Error(
              `Timeout publishing message ${routingKey} to queue`,
            );
          }
          throw err;
        }
      }
    }
  }
}
