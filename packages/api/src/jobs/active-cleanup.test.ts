import { v4 as uuid } from "uuid";

import * as appRouter from "../app-router";
import * as streamController from "../controllers/stream";
import { cache } from "../store/cache";
import { DB } from "../store/db";
import { NoopQueue, RabbitQueue } from "../store/queue";
import { rabbitMgmt } from "../test-helpers";
import params, { testId } from "../test-params";
import activeCleanup from "./active-cleanup";

describe("active-cleanup", () => {
  // There are further functional tests under controllers/stream.test.ts "active clean-up"

  let db: DB;

  beforeAll(async () => {
    db = new DB();
    await db.start({ postgresUrl: params.postgresUrl });
    await rabbitMgmt.createVhost(testId);
  });

  afterAll(async () => {
    await rabbitMgmt.deleteVhost(testId);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    cache.storage = null;
  });

  const mockStream = (isActive: boolean, lastSeen: number) => {
    return {
      id: uuid(),
      name: "stream1",
      playbackId: uuid(),
      streamKey: uuid(),
      isActive,
      lastSeen,
    };
  };

  it("should not call initClients if clients are passed", async () => {
    const initSpy = jest.spyOn(appRouter, "initClients");

    await activeCleanup(params, { jobsDb: db, queue: new NoopQueue() });

    expect(initSpy).not.toHaveBeenCalled();
  });

  it("does not register any queue event handlers", async () => {
    const originalInitClient = appRouter.initClients;
    const initSpy = jest
      .spyOn(appRouter, "initClients")
      .mockImplementation(async (params, name) => {
        const result = await originalInitClient(params, name);
        jest.spyOn(result.queue, "consume");
        return result;
      });

    await activeCleanup(params);

    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(initSpy).toHaveBeenLastCalledWith(params, "active-cleanup-job");

    const { queue } = await initSpy.mock.results[0].value;
    expect(queue.consume).not.toHaveBeenCalled();
  });

  it("calls triggerCleanUpIsActiveJob with the lost active streams", async () => {
    const triggerSpy = jest
      .spyOn(streamController, "triggerCleanUpIsActiveJob")
      .mockImplementation(() => [[], Promise.resolve()]);

    const now = Date.now();
    // 3 active streams
    for (let i = 0; i < 3; i++) {
      await db.stream.create(
        mockStream(true, now - streamController.ACTIVE_TIMEOUT / 2)
      );
    }
    // 3 inactive streams
    for (let i = 0; i < 3; i++) {
      await db.stream.create(
        mockStream(false, now - streamController.ACTIVE_TIMEOUT - 5000)
      );
    }
    // 3 active lost streams, only these should be cleaned up
    let expectedCleanedUp = [];
    for (let i = 0; i <= 3; i++) {
      const stream = await db.stream.create(
        mockStream(true, now - streamController.ACTIVE_TIMEOUT - i)
      );
      expectedCleanedUp.push(stream);
    }

    await activeCleanup(params);

    expect(triggerSpy).toHaveBeenCalledTimes(1);
    expect(triggerSpy).toHaveBeenLastCalledWith(
      params,
      expectedCleanedUp,
      expect.any(RabbitQueue),
      params.ingest[0].base
    );
  });

  it("publishes messages for cleaned up streams", async () => {
    const originalInitClient = appRouter.initClients;
    const initSpy = jest
      .spyOn(appRouter, "initClients")
      .mockImplementation(async (params, name) => {
        const result = await originalInitClient(params, name);
        jest.spyOn(result.queue, "consume");
        jest.spyOn(result.queue, "delayedPublishWebhook");
        return result;
      });

    const parentId = uuid();
    const lastSeen = Date.now() - streamController.ACTIVE_TIMEOUT - 1;
    const session = await db.session.create({
      id: uuid(),
      userId: uuid(),
      name: "session1",
      record: true,
      parentId,
      lastSeen,
    });
    await db.stream.create({
      ...mockStream(true, lastSeen),
      sessionId: session.id,
      parentId,
    });

    await activeCleanup(params);

    expect(initSpy).toHaveBeenCalledTimes(1);
    const { queue } = await initSpy.mock.results[0].value;

    expect(queue.consume).not.toHaveBeenCalled();
    expect(queue.delayedPublishWebhook).toHaveBeenCalledTimes(1);
    expect(queue.delayedPublishWebhook).toHaveBeenLastCalledWith(
      "events.recording.waiting",
      expect.anything(),
      expect.any(Number),
      "recording_waiting_delayed_events"
    );
    expect(queue.delayedPublishWebhook.mock.calls[0][1]).toMatchObject({
      type: "webhook_event",
      streamId: session.parentId,
      event: "recording.waiting",
      userId: session.userId,
      sessionId: session.id,
      payload: {
        session: {
          id: session.id,
        },
      },
    });
  });
});
