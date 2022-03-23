import { semaphore, sleep } from "../util";
import { RabbitQueue } from "./queue";
import { rabbitMgmt } from "../test-helpers";

jest.setTimeout(10000);

describe("Queue", () => {
  let queue: RabbitQueue;
  let vhost: string;
  beforeEach(async () => {
    try {
      vhost = `test_${Date.now()}`;
      await rabbitMgmt.createVhost(vhost);
      queue = await RabbitQueue.connect(`amqp://localhost:5672/${vhost}`);
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  afterEach(async () => {
    await queue.close();
    await rabbitMgmt.deleteVhost(vhost);
  });

  it("should be able to emit events and catch it via default consumer", async () => {
    await queue.consume("events", queue.handleMessage.bind(queue));
    await queue.publishWebhook("events.stream.started", {
      type: "webhook_event",
      id: "abc123",
      timestamp: Date.now(),
      streamId: "asdf",
      event: "stream.started",
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

    await queue.publishWebhook("events.stream.started", {
      type: "webhook_event",
      id: "custom_msg",
      timestamp: Date.now(),
      streamId: "asdf",
      event: "stream.started",
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

    emittedAt = Date.now();
    await queue.delayedPublishWebhook(
      "events.recording.ready",
      {
        type: "webhook_event",
        id: "delayedMsg",
        timestamp: Date.now(),
        streamId: "asdf",
        event: "recording.ready",
        userId: "fdsa",
      },
      2000
    );
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

    emittedAt = Date.now();
    await queue.delayedPublishWebhook(
      "events.recording.ready",
      {
        type: "webhook_event",
        id: "delayedMsg2",
        timestamp: Date.now(),
        streamId: "asdf",
        event: "recording.ready",
        userId: "fdsa",
      },
      1000
    );
    await sem.wait(3000);
    let duration = consumedAt - emittedAt;
    console.log("duration: ", duration);
    expect(duration).toBeGreaterThanOrEqual(1000);
    expect(resp.id).toBe("delayedMsg2");
  });

  it("delayed messages do not affect one another", async () => {
    const sem1 = semaphore();
    const sem2 = semaphore();
    let emittedAt, consumedAt1, consumedAt2;
    function onMsg(data) {
      var message = JSON.parse(data.content.toString());
      queue.ack(data);
      switch (message.id) {
        case "delayedMsg":
          consumedAt1 ??= Date.now();
          sem1.release();
          break;
        case "delayedMsg2":
          consumedAt2 ??= Date.now();
          sem2.release();
          break;
        default:
          console.error("unknown message", message);
          consumedAt1 = consumedAt2 = 0;
          break;
      }
    }
    await queue.consume("events", onMsg);

    emittedAt = Date.now();
    await queue.delayedPublishWebhook(
      "events.recording.ready",
      {
        type: "webhook_event",
        id: "delayedMsg",
        timestamp: Date.now(),
        streamId: "asdf",
        event: "recording.ready",
        userId: "fdsa",
      },
      1000
    );
    await queue.delayedPublishWebhook(
      "events.recording.ready",
      {
        type: "webhook_event",
        id: "delayedMsg2",
        timestamp: Date.now(),
        streamId: "asdf",
        event: "recording.ready",
        userId: "fdsa",
      },
      200
    );
    await sem2.wait(3000);
    let duration = consumedAt2 - emittedAt;
    expect(duration).toBeGreaterThanOrEqual(200);
    expect(duration).toBeLessThanOrEqual(500);

    await sem1.wait(3000);
    duration = consumedAt1 - emittedAt;
    expect(duration).toBeGreaterThanOrEqual(1000);
  });

  it("delayed messages keep the original routing key", async () => {
    const sem1 = semaphore();
    const sem2 = semaphore();
    let consumedIds = ["", ""];
    function onEvent(data) {
      var message = JSON.parse(data.content.toString());
      queue.ack(data);
      consumedIds[0] = message.id;
      sem1.release();
    }
    function onWebhook(data) {
      var message = JSON.parse(data.content.toString());
      queue.ack(data);
      consumedIds[1] = message.id;
      sem2.release();
    }
    await queue.consume("events", onEvent);
    await queue.consume("webhooks", onWebhook);

    await queue.delayedPublishWebhook(
      "events.recording.ready",
      {
        type: "webhook_event",
        id: "delayedMsg",
        timestamp: Date.now(),
        streamId: "asdf",
        event: "recording.ready",
        userId: "fdsa",
      },
      200
    );
    await queue.delayedPublishWebhook(
      "webhooks.recording.ready",
      {
        type: "webhook_event",
        id: "delayedMsg2",
        timestamp: Date.now(),
        streamId: "asdf",
        event: "recording.ready",
        userId: "fdsa",
      },
      200
    );
    await sem1.wait(3000);
    await sem2.wait(3000);
    expect(consumedIds).toEqual(["delayedMsg", "delayedMsg2"]);
  });
});
