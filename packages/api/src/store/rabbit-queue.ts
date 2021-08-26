import amqp from "amqp-connection-manager";
import { ChannelWrapper, AmqpConnectionManager } from "amqp-connection-manager";
import { Channel, ConsumeMessage } from "amqplib";
import messages from "./messages";
import { EventKey } from "./webhook-table";

const EXCHANGE_NAME = "webhook_default_exchange";
const QUEUES = {
  events: "webhook_events_queue",
  webhooks: "webhook_cannon_single_url",
} as const;

type QueueName = keyof typeof QUEUES;
type RoutingKey = `events.${EventKey}` | `webhooks.${string}`;

export default class MessageQueue {
  private channel: ChannelWrapper;
  private connection: AmqpConnectionManager;

  constructor() {}

  public connect(url: string): Promise<void> {
    // Create a new connection manager
    this.connection = amqp.connect([url]);
    this.channel = this.connection.createChannel({
      json: true,
      setup: async (channel: Channel) => {
        await Promise.all([
          channel.assertQueue(QUEUES.events, { durable: true }),
          channel.assertQueue(QUEUES.webhooks, { durable: true }),
          channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true }),
          // TODO: remove this after all old queues have been deleted
          channel.deleteQueue("webhook_default_queue", { ifUnused: true }),
        ]);
        await Promise.all([
          channel.bindQueue(QUEUES.events, EXCHANGE_NAME, "events.#"),
          channel.bindQueue(QUEUES.webhooks, EXCHANGE_NAME, "webhooks.#"),
          channel.prefetch(1),
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

  public async publish(route: RoutingKey, msg: messages.Any): Promise<void> {
    console.log(`publishing to ${route} : ${JSON.stringify(msg)}`);
    await this.channel.publish(EXCHANGE_NAME, route, msg, { persistent: true });
  }

  public async delayedPublish(
    routingKey: RoutingKey,
    msg: messages.Any,
    delay: number
  ): Promise<void> {
    // TODO: Reimplement this without on-demand queues. Idea: Use a single delayed queue
    // and per-message expiration and routing key (needs an exchange for that).
    const delaySec = delay / 1000;
    const delayedQueueName = `delayed_queue_${routingKey}_${delaySec}s`;
    const setupFunc = (channel: Channel) =>
      channel.assertQueue(delayedQueueName, {
        messageTtl: delay + 100,
        deadLetterExchange: EXCHANGE_NAME,
        deadLetterRoutingKey: routingKey,
        expires: delay + 15000,
        durable: true,
      });
    await this.channel.addSetup(setupFunc);
    try {
      console.log(
        `delayed emitting: delay=${delaySec}s queue=${delayedQueueName} msg=`,
        msg
      );
      await this.channel.sendToQueue(delayedQueueName, msg, {
        persistent: true,
      });
    } finally {
      // avoid accumulating duplicate setup funcs on the channel manager
      await this.channel.removeSetup(setupFunc, () => {});
    }
  }
}
