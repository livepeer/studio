import amqp from "amqp-connection-manager";
import { ChannelWrapper, AmqpConnectionManager } from "amqp-connection-manager";
import { Channel, ConsumeMessage, Options } from "amqplib";

const QUEUE_NAME = "webhook_default_queue";
const EXCHANGE_NAME = "webhook_default_exchange";

export default class MessageQueue {
  private channel: ChannelWrapper;
  private connection: AmqpConnectionManager;

  constructor() {}

  public async connect(url: string): Promise<void> {
    // Create a new connection manager
    this.connection = await amqp.connect([url]);
    this.connection.on("connect", () => console.log("AMQP Connected!"));
    this.connection.on("disconnect", (err: Error) =>
      console.log("AMQP Disconnected.", err)
    );
    this.connection.on("error", (error: Error) => {
      console.error(`Connection error: ${error}`);
    });

    this.channel = await this.connection.createChannel({
      json: true,
      setup: async function (channel: Channel) {
        await Promise.all([
          channel.assertQueue(QUEUE_NAME),
          // channel.assertQueue("delayedQueue", {
          //   messageTtl: 5000,
          //   deadLetterExchange: EXCHANGE_NAME
          // }),
          channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true }),
          channel.prefetch(1),
          channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, "#"),
          // channel.consume(QUEUE_NAME, handleMessage)
        ]);
        // return channel.assertQueue('rxQueueName', {durable: true});
      },
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

  public async consume(func: (msg: ConsumeMessage) => void): Promise<void> {
    if (!func) {
      throw new Error("RabbitMQ | consume | func is undefined");
    }
    console.log("adding consumer");
    await this.channel.addSetup((channel: Channel) => {
      return Promise.all([
        channel.assertQueue(QUEUE_NAME),
        channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, "#"),
        channel.consume(QUEUE_NAME, func),
      ]);
    });
  }

  public handleMessage(data: any) {
    var message = JSON.parse(data.content.toString());
    console.log("subscriber: got message", message);
    this.ack(data);
  }

  public async emit(msg: Object): Promise<void> {
    console.log("emitting ", msg);
    await this.channel.sendToQueue(QUEUE_NAME, msg);
  }

  public async delayedEmit(msg: Object, delay: number): Promise<void> {
    console.log(`delayed emitting delay=${delay / 1000}s`, msg);
    await this.channel.addSetup((channel: Channel) => {
      return Promise.all([
        channel.assertQueue(`delayedQueue_${delay / 1000}s`, {
          messageTtl: delay,
          deadLetterExchange: EXCHANGE_NAME,
          expires: delay + 15000,
        }),
      ]);
    });
    console.log("emitting ", msg);
    await this.channel.sendToQueue(`delayedQueue_${delay / 1000}s`, msg);
  }
}
