import amqp from "amqp-connection-manager";
import { ChannelWrapper, AmqpConnectionManager } from "amqp-connection-manager";
import { Channel, ConsumeMessage, Options } from "amqplib";

const QUEUE_NAME = "webhook_default_queue";
const EXCHANGE_NAME = "webhook_default_exchange";
const WEBHOOK_CANNON_SINGLE_URL = "webhook_cannon_single_url";

export default class MessageQueue {
  private channel: ChannelWrapper;
  private connection: AmqpConnectionManager;
  private queues: Record<string, string>;

  constructor() {
    this.queues = {
      events: QUEUE_NAME,
      webhooks: WEBHOOK_CANNON_SINGLE_URL,
    };
  }

  public connect(url: string): Promise<void> {
    // Create a new connection manager
    this.connection = amqp.connect([url]);
    this.channel = this.connection.createChannel({
      json: true,
      setup: async (channel: Channel) => {
        await Promise.all([
          channel.assertQueue(this.queues.events, { durable: true }),
          channel.assertQueue(this.queues.webhooks, { durable: true }),
          channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true }),
          channel.bindQueue(this.queues.events, EXCHANGE_NAME, "events.#"),
          channel.bindQueue(this.queues.webhooks, EXCHANGE_NAME, "webhooks.#"),
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
    await this.connection.removeAllListeners("connect");
    await this.connection.removeAllListeners("disconnect");
    await this.connection.removeAllListeners("error");
    await this.connection.close();
  }

  public ack(data: any): void {
    this.channel.ack(data);
  }

  public nack(data: any): void {
    this.channel.nack(data);
  }

  public async consume(
    queueName: string,
    func: (msg: ConsumeMessage) => void
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
    var message = JSON.parse(data.content.toString());
    console.log("subscriber: got message", message);
    this.ack(data);
  }

  public async sendToQueue(msg: Object): Promise<void> {
    console.log("emitting ", msg);
    await this.channel.sendToQueue(QUEUE_NAME, msg);
  }

  public async publish(route: string, msg: object): Promise<void> {
    console.log(`publishing to ${route} : ${JSON.stringify(msg)}`);
    await this.channel.publish(EXCHANGE_NAME, route, msg, { persistent: true });
  }

  public async delayedPublish(
    routingKey: string,
    msg: Object,
    delay: number
  ): Promise<void> {
    await this.channel.addSetup((channel: Channel) => {
      return Promise.all([
        channel.assertQueue(`delayedQueue_${delay / 1000}s`, {
          messageTtl: delay + 100,
          deadLetterExchange: EXCHANGE_NAME,
          deadLetterRoutingKey: routingKey,
          expires: delay + 15000,
        }),
      ]);
    });
    console.log(`delayed emitting delay=${delay / 1000}s`, msg);
    await this.channel.sendToQueue(`delayedQueue_${delay / 1000}s`, msg, {
      persistent: true,
    });
  }
}
