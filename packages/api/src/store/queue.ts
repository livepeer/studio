import amqp from "amqp-connection-manager";
import { ChannelWrapper, AmqpConnectionManager } from "amqp-connection-manager";
import { Channel, ConsumeMessage } from "amqplib";
import messages from "./messages";
import { EventKey } from "./webhook-table";

const EXCHANGES = {
  global: "lp_api_global",
  returned: "lp_api_returned_msgs",
  webhooks: "webhook_default_exchange",
  delayed: "webhook_delayed_exchange",
} as const;
const QUEUES = {
  returned: "lp_api_returned_msgs",
  events: "webhook_events_queue",
  webhooks: "webhook_cannon_single_url",
  delayed: "webhook_delayed_queue",
} as const;

type QueueName = keyof typeof QUEUES;
type RoutingKey = `events.${EventKey}` | `webhooks.${string}`;

export default interface Queue {
  publishWebhook(key: RoutingKey, msg: messages.Webhooks): Promise<void>;
  publishGlobal(key: string, msg: messages.Any): Promise<void>;
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

  async publishGlobal(key: string, msg: messages.Any) {
    console.warn(
      `WARN: Publish global to noop queue. key=${key} message=`,
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
        // TODO: Move this setup to the consumers of the queue, not to mix
        // completely different contexts here.
        await Promise.all([
          channel.assertQueue(QUEUES.events, { durable: true }),
          channel.assertQueue(QUEUES.webhooks, { durable: true }),
          channel.assertQueue(QUEUES.returned, { durable: true }),
          channel.assertExchange(EXCHANGES.webhooks, "topic", {
            durable: true,
          }),
          channel.assertExchange(EXCHANGES.delayed, "topic", {
            durable: true,
          }),
          channel.assertExchange(EXCHANGES.returned, "fanout", {
            durable: true,
          }),
        ]);
        await Promise.all([
          channel.assertExchange(EXCHANGES.global, "topic", {
            durable: true,
            alternateExchange: EXCHANGES.returned,
          }),
          channel.bindQueue(QUEUES.events, EXCHANGES.webhooks, "events.#"),
          channel.bindQueue(QUEUES.webhooks, EXCHANGES.webhooks, "webhooks.#"),
          channel.bindQueue(QUEUES.returned, EXCHANGES.returned, "#"),
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

  public async publishGlobal(route: string, msg: messages.Any): Promise<void> {
    console.log(`publishing global to ${route} : ${JSON.stringify(msg)}`);
    await this.channel.publish(EXCHANGES.global, route, msg, {
      persistent: true,
    });
  }

  // This function publishes a message to an alternate exchange/queue used only
  // for delayed messages. Messages are published with an expiration equal to
  // the desired `delay` parameter, and after they expire are sent to the main
  // exchange through the delayed queue deadletterExchange configuration.
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
