import amqp from "amqp-connection-manager";
import { ChannelWrapper, AmqpConnectionManager } from "amqp-connection-manager";
import { Channel, ConsumeMessage } from "amqplib";
import messages from "./messages";
import { EventKey } from "./webhook-table";

const EXCHANGES = {
  webhooks: "webhook_default_exchange",
  delayed: "webhook_delayed_exchange",
} as const;
const QUEUES = {
  events: "webhook_events_queue",
  webhooks: "webhook_cannon_single_url",
  delayed: "webhook_delayed_queue",
} as const;

type QueueName = keyof typeof QUEUES;
type RoutingKey = `events.${EventKey}` | `webhooks.${string}`;

export default interface Queue {
  publishWebhook(key: RoutingKey, msg: messages.Webhooks): Promise<void>;
  delayedPublishWebhook(
    key: RoutingKey,
    msg: messages.Any,
    delay: number
  ): Promise<void>;

  consume(name: QueueName, func: (msg: ConsumeMessage) => void): Promise<void>;
  ack(data: any): void;
  nack(data: any): void;

  close(): Promise<void>;
}

export class NoopQueue implements Queue {
  async publishWebhook(key: RoutingKey, msg: messages.Webhooks) {
    console.warn(
      `WARN: Publish webhook to noop queue. key=${key} message=`,
      msg
    );
  }

  async delayedPublishWebhook(
    key: RoutingKey,
    msg: messages.Any,
    delay: number
  ) {
    console.warn(
      `WARN: Delayed publish event to noop queue. key=${key} delay=${delay} message=`,
      msg
    );
  }

  async consume(_: QueueName, __: (_: ConsumeMessage) => void) {}
  ack(_: any) {}
  nack(_: any) {}

  async close() {}
}

export class RabbitQueue implements Queue {
  private channel: ChannelWrapper;
  private connection: AmqpConnectionManager;

  public static async connect(url: string): Promise<RabbitQueue> {
    const queue = new RabbitQueue();
    await queue.init(url);
    return queue;
  }

  private constructor() {}

  private init(url: string): Promise<void> {
    // Create a new connection manager
    this.connection = amqp.connect([url]);
    this.channel = this.connection.createChannel({
      json: true,
      setup: async (channel: Channel) => {
        await Promise.all([
          channel.assertQueue(QUEUES.events, { durable: true }),
          channel.assertQueue(QUEUES.webhooks, { durable: true }),
          channel.assertExchange(EXCHANGES.webhooks, "topic", {
            durable: true,
          }),
          channel.assertExchange(EXCHANGES.delayed, "topic", {
            durable: true,
          }),
        ]);
        await Promise.all([
          channel.bindQueue(QUEUES.events, EXCHANGES.webhooks, "events.#"),
          channel.bindQueue(QUEUES.webhooks, EXCHANGES.webhooks, "webhooks.#"),
          channel
            .assertQueue(QUEUES.delayed, {
              deadLetterExchange: EXCHANGES.webhooks,
              durable: true,
            })
            .then(() =>
              channel.bindQueue(QUEUES.delayed, EXCHANGES.delayed, "#")
            ),
          channel.prefetch(2),
        ]);
      },
    });
    return new Promise<void>((resolve, reject) => {
      let resolveOnce = (err?: Error) => {
        if (!resolve) return;
        err ? reject(err) : resolve();
        resolve = null;
      };
      this.connection.on("connect", () => {
        console.log("AMQP Connected!");
        resolveOnce();
      });
      this.connection.on("disconnect", ({ err }: { err: Error }) => {
        console.log("AMQP Disconnected.", err);
        resolveOnce(
          new Error(`Error connecting to RabbitMQ. ${err.name}: ${err.message}`)
        );
      });
    });
  }

  public async close(): Promise<void> {
    this.connection.removeAllListeners("connect");
    this.connection.removeAllListeners("disconnect");
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
    func: (msg: ConsumeMessage) => void
  ): Promise<void> {
    if (!func) {
      throw new Error("RabbitMQ | consume | func is undefined");
    }
    console.log("adding consumer");
    await this.channel.addSetup((channel: Channel) => {
      return channel.consume(QUEUES[queueName], func);
    });
  }

  public handleMessage(data: any) {
    var message = JSON.parse(data.content.toString());
    console.log("subscriber: got message", message);
    this.ack(data);
  }

  public async sendToQueue(msg: messages.Any): Promise<void> {
    console.log("emitting ", msg);
    await this.channel.sendToQueue(QUEUES.events, msg);
  }

  public async publishWebhook(
    route: RoutingKey,
    msg: messages.Any
  ): Promise<void> {
    console.log(`publishing webhook to ${route} : ${JSON.stringify(msg)}`);
    await this.channel.publish(EXCHANGES.webhooks, route, msg, {
      persistent: true,
    });
  }

  public async delayedPublishWebhook(
    routingKey: RoutingKey,
    msg: messages.Any,
    delay: number
  ): Promise<void> {
    console.log(`emitting delayed message: delay=${delay / 1000}s msg=`, msg);
    await this.channel.publish(EXCHANGES.delayed, routingKey, msg, {
      persistent: true,
      expiration: delay,
    });
  }
}
