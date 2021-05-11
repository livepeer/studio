import uuid from "uuid/v4";
import { DB } from "./db";
import Table from "./table";
import { Pool } from "pg";
import QueueTable from "./queue";
import schema from "../schema/schema.json";

jest.setTimeout(15000);

describe("Queue", () => {
  let db: DB;
  let table: QueueTable;
  beforeEach(async () => {
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
    });
    const event = await db.queue.pop();
    expect(event.channel).toEqual("test.channel");
  });
});
