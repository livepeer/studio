import { semaphore, sleep } from "../util";
import MessageQueue from "./rabbit-queue";

jest.setTimeout(10000);

describe("Queue", () => {
  let queue: MessageQueue;
  beforeEach(async () => {
    try {
      queue = new MessageQueue();
    } catch (e) {
      console.log(e);
    }
    await queue.connect("amqp://localhost:5672/livepeer");
    // await sleep(2000);
    // await queue.consume()
  });

  afterEach(async () => {
    await queue.close();
  });

  it("should be able to emit events and catch it via default consumer", async () => {
    await queue.consume("events", queue.handleMessage.bind(queue));
    await queue.emit({
      id: "abc123",
      createdAt: Date.now(),
      channel: "test.channel",
      event: "teststarted",
      streamId: "asdf",
      userId: "fdsa",
      isConsumed: false,
    });
    await sleep(500);
    console.log("done");
  });

  it("should be able to add a custom consumer", async () => {
    const sem = semaphore();
    let resp;
    function onMsg(data) {
      var message = JSON.parse(data.content.toString());
      console.log("custom consumer got a msg", message);
      resp = message;
      queue.ack(data);
      sem.release();
    }

    await queue.consume("events", onMsg);

    await queue.emit({
      id: "custom_msg",
      createdAt: Date.now(),
      channel: "test.channel",
      event: "teststarted",
      streamId: "asdf",
      userId: "fdsa",
      isConsumed: false,
    });
    await sem.wait(2000);
    expect(resp.id).toBe("custom_msg");
  });

  it("should be able to emit/consume a delayed msg", async () => {
    const sem = semaphore();
    let resp, emittedAt, consumedAt;
    function onMsg(data) {
      consumedAt = Date.now();
      var message = JSON.parse(data.content.toString());
      console.log("consumer got a msg", message);
      resp = message;
      queue.ack(data);
      sem.release();
    }

    await queue.consume("events", onMsg);

    await queue.delayedEmit(
      {
        id: "delayedMsg",
        createdAt: Date.now(),
        channel: "test.channel",
        event: "teststarted",
        streamId: "asdf",
        userId: "fdsa",
        isConsumed: false,
      },
      2000
    );
    emittedAt = Date.now();
    await sem.wait(4000);
    let duration = consumedAt - emittedAt;
    console.log("duration: ", duration);
    expect(duration).toBeGreaterThanOrEqual(2000);
    expect(resp.id).toBe("delayedMsg");
  });

  it("should be able to emit/consume a another delayed msg", async () => {
    const sem = semaphore();
    let resp, emittedAt, consumedAt;
    function onMsg(data) {
      consumedAt = Date.now();
      var message = JSON.parse(data.content.toString());
      console.log("consumer got a msg", message);
      resp = message;
      queue.ack(data);
      sem.release();
    }

    await queue.consume("events", onMsg);

    await queue.delayedEmit(
      {
        id: "delayedMsg2",
        createdAt: Date.now(),
        channel: "test.channel",
        event: "teststarted",
        streamId: "asdf",
        userId: "fdsa",
        isConsumed: false,
      },
      1000
    );
    emittedAt = Date.now();
    await sem.wait(3000);
    let duration = consumedAt - emittedAt;
    console.log("duration: ", duration);
    expect(duration).toBeGreaterThanOrEqual(1000);
    expect(resp.id).toBe("delayedMsg2");
  });
});
