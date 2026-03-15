import { v4 as uuid } from "uuid";

import * as appRouter from "../app-router";
import * as projectsController from "../controllers/project";
import { cache } from "../store/cache";
import { DB } from "../store/db";
import Queue, { RabbitQueue } from "../store/queue";
import { rabbitMgmt } from "../test-helpers";
import params, { testId } from "../test-params";
import projectsCleanup from "./projects-cleanup";
import { Request } from "express";

describe("projects-cleanup", () => {
  // There are further functional tests under controllers/stream.test.ts "active clean-up"

  let db: DB;
  let initClientsSpy: jest.SpyInstance;

  beforeAll(async () => {
    db = new DB();
    await db.start({ postgresUrl: params.postgresUrl });
    await rabbitMgmt.createVhost(testId);
  });

  afterAll(async () => {
    await rabbitMgmt.deleteVhost(testId);
  });

  let queue: Queue;

  beforeEach(() => {
    const originalInitClient = appRouter.initClients;
    initClientsSpy = jest
      .spyOn(appRouter, "initClients")
      .mockImplementation(async (params, name) => {
        const result = await originalInitClient(params, name);
        queue = result.queue;
        jest.spyOn(queue, "consume");
        jest.spyOn(queue, "delayedPublishWebhook");
        return result;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cache.storage = null;
    queue?.close();
    queue = null;
  });

  const mockProject = (deleted: boolean, deletedAt: number) => {
    return {
      id: uuid(),
      name: "project1",
      deleted,
      deletedAt,
    };
  };

  const mockStream = (projectId: string) => {
    return {
      id: uuid(),
      name: "stream1",
      playbackId: uuid(),
      streamKey: uuid(),
      projectId,
    };
  };

  const mockAsset = (projectId: string) => {
    return {
      id: uuid(),
      name: "asset1",
      projectId,
      source: {
        type: "url" as const,
        url: "someSource",
      },
    };
  };

  it("it should deleted related assets and streams", async () => {
    const triggerSpy = jest
      .spyOn(projectsController, "triggerCleanUpProjectsJob")
      .mockImplementation(() => [[], Promise.resolve()]);

    const now = Date.now();
    const project = await db.project.create(mockProject(false, now - 10000));

    let streamsToDelete = [];
    let assetsToDelete = [];
    // 3 streams
    for (let i = 0; i < 3; i++) {
      const stream = await db.stream.create(mockStream(project.id));
      streamsToDelete.push(stream.id);
    }
    // 3 assets
    for (let i = 0; i < 3; i++) {
      const asset = await db.asset.create(mockAsset(project.id));
      assetsToDelete.push(asset.id);
    }

    let mockReq: Request = {
      user: {
        id: "test",
        admin: false,
        defaultProjectId: uuid(),
      },
      project: {
        id: "test",
      },
    } as Request;

    await projectsCleanup(params, mockReq);

    expect(triggerSpy).toHaveBeenCalledTimes(1);

    for (const streamId of streamsToDelete) {
      let stream = await db.stream.get(streamId);
      expect(stream.id).toBe(streamId);
      expect(stream.deleted).toBe(true);
    }
    for (const assetId of assetsToDelete) {
      let asset = await db.asset.get(assetId);
      expect(asset.id).toBe(assetId);
      expect(asset.deleted).toBe(true);
    }
  });
});
