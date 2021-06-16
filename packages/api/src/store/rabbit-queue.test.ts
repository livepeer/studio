import Queue from "./rabbit-queue";

// jest.setTimeout(15000);
async function sleep(duration) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, duration);
  });
}

describe("Queue", () => {
  let queue: Queue;
  beforeEach(async () => {
    try {
      queue = new Queue();
    } catch (e) {
      console.log(e);
    }
    await queue.connect();
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
});
