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
    this.connection = await amqp.connect([
      url || process.env.CLOUDAMQP_MQTT_URL,
    ]);
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
    await this.connection.close();
  }

  public ack(data: any): void {
    this.channel.ack(data);
  }

  public async consume(func: (msg: ConsumeMessage) => void): Promise<void> {
    if (!func) {
      console.log("func is undefined");
      func = this.handleMessage.bind(this);
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
    this.channel.ack(data);
  }

  public async emit(msg: Object): Promise<void> {
    console.log("emitting ", msg);
    this.channel.sendToQueue(QUEUE_NAME, msg);
    // .then(function() {
    //     return console.log("Message was sent");
    // }).catch(function(err: Error) {
    //     return console.log("Message was rejected");
    // });
  }

  public async delayedEmit(msg: Object, delay: number): Promise<void> {
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
    this.channel.sendToQueue(`delayedQueue_${delay / 1000}s`, msg);
    // .then(function() {
    //     return console.log("Message was sent");
    // }).catch(function(err: Error) {
    //     return console.log("Message was rejected");
    // });
  }
}
