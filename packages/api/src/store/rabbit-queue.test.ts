import MessageQueue from "./rabbit-queue";

jest.setTimeout(15000);
async function sleep(duration) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, duration);
  });
}

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
    await queue.consume();
    await queue.emit({
      id: "abc123",
      createdAt: Date.now(),
      channel: "test.channel",
      event: "teststarted",
      streamId: "asdf",
      userId: "fdsa",
      isConsumed: false,
    });
    await sleep(2000);
    console.log("done");
  });

  it("should be able to add a custom consumer", async () => {
    let resp;
    function onMsg(data) {
      var message = JSON.parse(data.content.toString());
      console.log("custom consumer got a msg", message);
      resp = message;
      queue.ack(data);
    }

    await queue.consume(onMsg);

    await queue.emit({
      id: "custom_msg",
      createdAt: Date.now(),
      channel: "test.channel",
      event: "teststarted",
      streamId: "asdf",
      userId: "fdsa",
      isConsumed: false,
    });
    await sleep(2000);
    expect(resp.id).toBe("custom_msg");
  });

  it("should be able to emit/consume a delayed msg", async () => {
    let resp, emittedAt, consumedAt;
    function onMsg(data) {
      consumedAt = Date.now();
      var message = JSON.parse(data.content.toString());
      console.log("consumer got a msg", message);
      resp = message;
      queue.ack(data);
    }

    await queue.consume(onMsg);

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
      5000
    );
    emittedAt = Date.now();
    await sleep(7000);
    let duration = consumedAt - emittedAt;
    console.log("duration: ", duration);
    if (duration < 5000) {
      throw new Error("the 5s delayed queue failed");
    }
    expect(resp.id).toBe("delayedMsg");
  });

  it("should be able to emit/consume a another delayed msg", async () => {
    let resp, emittedAt, consumedAt;
    function onMsg(data) {
      consumedAt = Date.now();
      var message = JSON.parse(data.content.toString());
      console.log("consumer got a msg", message);
      resp = message;
      queue.ack(data);
    }

    await queue.consume(onMsg);

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
      3000
    );
    emittedAt = Date.now();
    await sleep(5000);
    let duration = consumedAt - emittedAt;
    console.log("duration: ", duration);
    if (duration < 3000) {
      throw new Error("the 3s delayed queue failed");
    }
    expect(resp.id).toBe("delayedMsg2");
  });
});
