import uuid from "uuid/v4";
import { DB } from "./db";
import Table from "./table";
import { Pool } from "pg";
import QueueTable from "./queue";
import schema from "../schema/schema.json";
import { Queue } from "../schema/types";

jest.setTimeout(15000);

async function processEvent(doc: Queue) {
  console.log("processing doc id: ", doc.id);
  return doc.id;
}

describe("Queue", () => {
  let db: DB;

  beforeEach(async () => {
    try {
      const pool = new Pool({
        connectionString: `postgresql://postgres@localhost/postgres`,
        connectionTimeoutMillis: 5000,
      });
      await pool.query("DROP DATABASE test");
      await pool.end();
    } catch (e) {
      console.log(e);
    }

    db = new DB();
    await db.start({ postgresUrl: `postgresql://postgres@localhost/test` });
    // const schemas = schema.components.schemas;
    // table = new QueueTable({ db, schema: schemas["queue"] });
    // await table.ensureTable();
  });

  afterEach(async () => {
    await db.close();
    const pool = new Pool({
      connectionString: `postgresql://postgres@localhost/postgres`,
      connectionTimeoutMillis: 5000,
    });
    await pool.query("DROP DATABASE test");
    await pool.end();
  });

  it("should do anything", async () => {
    await db.queue.emit({
      id: "abc123",
      time: Date.now(),
      channel: "test.channel",
      event: "teststarted",
      streamId: "asdf",
      userId: "fdsa",
      isConsumed: false,
    });

    await db.queue.emit({
      id: "abc1234",
      time: Date.now(),
      channel: "test.channel",
      event: "teststarted",
      streamId: "asdf",
      userId: "fdsa",
      isConsumed: false,
    });

    const event = await db.queue.pop(processEvent);
    console.log("event db1: ", event);
    console.log("event Channel: ", event.channel);
    expect(event.channel).toEqual("test.channel");

    const event2 = await db.queue.pop();
    console.log("event2 ", event2);
    expect(event2.id).toEqual("abc1234");

    const event3 = await db.queue.pop();
    console.log("event3 ", event3);
    expect(event3).toEqual(null);

    await db.queue.stop();
  });
});
