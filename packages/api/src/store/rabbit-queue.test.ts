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
    await queue.publish("events.stream.started", {
      type: "webhook_event",
      id: "abc123",
      timestamp: Date.now(),
      manifestId: "manifestId",
      event: "stream.started",
      streamId: "asdf",
      userId: "fdsa",
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

    await queue.publish("events.stream.started", {
      type: "webhook_event",
      id: "custom_msg",
      timestamp: Date.now(),
      manifestId: "manifestId",
      event: "stream.started",
      streamId: "asdf",
      userId: "fdsa",
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

    await queue.delayedPublish(
      "events.recording.ready",
      {
        type: "webhook_event",
        id: "delayedMsg",
        timestamp: Date.now(),
        manifestId: "manifestId",
        event: "recording.ready",
        streamId: "asdf",
        userId: "fdsa",
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

    await queue.delayedPublish(
      "events.recording.ready",
      {
        type: "webhook_event",
        id: "delayedMsg2",
        timestamp: Date.now(),
        manifestId: "manifestId",
        event: "recording.ready",
        streamId: "asdf",
        userId: "fdsa",
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
