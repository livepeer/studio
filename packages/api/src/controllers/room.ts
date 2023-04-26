import express, { Router } from "express";
import {
  AccessToken,
  EgressClient,
  RoomServiceClient,
  StreamOutput,
  StreamProtocol,
  WebhookReceiver,
} from "livekit-server-sdk";
import { v4 as uuid } from "uuid";
import { authorizer, validatePost } from "../middleware";
import { db } from "../store";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../store/errors";
import { Room } from "../schema/types";
import { WithID } from "../store/types";

const app = Router();

app.post("/", authorizer({}), async (req, res) => {
  if (req.config.livekitHost == "") {
    res.status(400);
    return res.send("not enabled");
  }

  const id = uuid();
  const svc = new RoomServiceClient(
    req.config.livekitHost,
    req.config.livekitApiKey,
    req.config.livekitSecret
  );
  const room = await svc.createRoom({
    name: id,
    // timeout in seconds
    emptyTimeout: 15 * 60,
    maxParticipants: 10,
    metadata: JSON.stringify({ userId: req.user.id }),
  });
  console.log("livekit room created", room);

  await db.room.create({
    id: id,
    userId: req.user.id,
    createdAt: new Date().getTime(),
    participants: {},
    events: [],
  });

  res.status(201);
  res.json({
    id: id,
  });
});

app.get("/:roomId", authorizer({}), async (req, res) => {
  const room = await db.room.get(req.params.roomId);
  if (!room) {
    throw new NotFoundError(`room not found`);
  }

  if (!room || room.deleted) {
    throw new NotFoundError(`room not found`);
  }

  if (!req.user.admin && req.user.id !== room.userId) {
    throw new ForbiddenError(`users may only view their own rooms`);
  }

  res.status(200).json(toExternalRoom(room, req.user.admin));
});

function toExternalRoom(room: Room, isAdmin = false) {
  if (isAdmin) {
    return room;
  }
  const roomForResp = {
    id: room.id,
    updatedAt: room.updatedAt,
    createdAt: room.createdAt,
    participants: room.participants,
  };

  for (const key in roomForResp.participants) {
    roomForResp.participants[key].tracksPublished = undefined;
  }
  return roomForResp;
}

app.delete("/:roomId", authorizer({}), async (req, res) => {
  const room = await db.room.get(req.params.roomId);

  if (!req.user.admin && req.user.id !== room.userId) {
    throw new ForbiddenError(`users may only delete their own rooms`);
  }

  const svc = new RoomServiceClient(
    req.config.livekitHost,
    req.config.livekitApiKey,
    req.config.livekitSecret
  );
  await svc.deleteRoom(req.params.roomId);

  room.deleted = true;
  room.deletedAt = new Date().getTime();
  await db.room.replace(room);

  res.status(204).end();
});

app.post(
  "/:roomId/egress",
  authorizer({}),
  validatePost("room-egress-payload"),
  async (req, res) => {
    const room = await db.room.get(req.params.roomId);

    if (!req.user.admin && req.user.id !== room.userId) {
      throw new ForbiddenError(`users may only modify their own rooms`);
    }

    if (room.egressId !== undefined) {
      throw new BadRequestError("egress already started");
    }

    const egressClient = new EgressClient(
      req.config.livekitHost,
      req.config.livekitApiKey,
      req.config.livekitSecret
    );
    const output: StreamOutput = {
      protocol: StreamProtocol.RTMP,
      urls: [req.body.rtmpURL],
    };

    const info = await egressClient.startRoomCompositeEgress(
      req.params.roomId,
      output,
      {
        layout: "speaker-dark",
        encodingOptions: {
          keyFrameInterval: 2,
        },
      }
    );
    console.log("egress started", info);
    room.egressId = info.egressId;
    room.updatedAt = new Date().getTime();
    await db.room.replace(room);
    res.status(204).end();
  }
);

app.delete("/:roomId/egress", authorizer({}), async (req, res) => {
  const room = await db.room.get(req.params.roomId);

  if (!req.user.admin && req.user.id !== room.userId) {
    throw new ForbiddenError(`users may only modify their own rooms`);
  }

  if (room.egressId === undefined) {
    throw new BadRequestError("egress has not started");
  }

  const egressClient = new EgressClient(
    req.config.livekitHost,
    req.config.livekitApiKey,
    req.config.livekitSecret
  );

  const info = await egressClient.stopEgress(room.egressId);
  console.log("egress stopped", info);
  room.egressId = undefined;
  room.updatedAt = new Date().getTime();
  await db.room.replace(room);
  res.status(204).end();
});

app.post(
  "/:roomId/user",
  authorizer({}),
  validatePost("room-user-payload"),
  async (req, res) => {
    const room = await db.room.get(req.params.roomId);

    if (!req.user.admin && req.user.id !== room.userId) {
      throw new ForbiddenError(`users may only add users to their own rooms`);
    }

    const id = uuid();
    const at = new AccessToken(
      req.config.livekitApiKey,
      req.config.livekitSecret,
      {
        name: req.body.name,
        identity: id,
        ttl: 5 * 60,
      }
    );
    at.addGrant({ roomJoin: true, room: req.params.roomId });
    const token = at.toJwt();

    res.status(201);
    res.json({
      id: id,
      joinUrl:
        "https://meet.livekit.io/custom?liveKitUrl=" +
        req.config.livekitHost +
        "&token=" +
        token,
    });
  }
);

app.delete("/:roomId/user/:userId", authorizer({}), async (req, res) => {
  const room = await db.room.get(req.params.roomId);

  if (!req.user.admin && req.user.id !== room.userId) {
    throw new ForbiddenError(
      `users may only delete users from their own rooms`
    );
  }

  const svc = new RoomServiceClient(
    req.config.livekitHost,
    req.config.livekitApiKey,
    req.config.livekitSecret
  );
  await svc.removeParticipant(req.params.roomId, req.params.userId);

  res.status(204).end();
});

// Implement a webhook handler to receive webhooks from Livekit to update our state with room and participant details.
app.post("/webhook", express.raw({ type: "*/*" }), async (req, res) => {
  const receiver = new WebhookReceiver(
    req.config.livekitApiKey,
    req.config.livekitSecret
  );

  // event is a WebhookEvent object
  let event;
  try {
    event = receiver.receive(req.body, req.get("Authorization"));
  } catch (e) {
    console.log(
      "failed to receive room webhook. auth:",
      req.get("Authorization")
    );
    throw e;
  }

  const roomId = event.room.name;
  if (!roomId) {
    throw new BadRequestError(`no room name on event`);
  }
  const room = await db.room.get(roomId);
  if (!room) {
    throw new NotFoundError(`room not found`);
  }

  switch (event.event) {
    case "track_published":
    case "participant_joined":
    case "participant_left":
      const svc = new RoomServiceClient(
        req.config.livekitHost,
        req.config.livekitApiKey,
        req.config.livekitSecret
      );
      const participants = await svc.listParticipants(roomId);

      for (const participant of participants) {
        if (room.participants[participant.identity] === undefined) {
          room.participants[participant.identity] = {
            identity: participant.identity,
            name: participant.name,
            joinedAt: participant.joinedAt,
            tracksPublished: {},
          };
        }
        if (event.event == "participant_left") {
          room.participants[participant.identity].leftAt = new Date().getTime();
        }

        let tracks = room.participants[participant.identity].tracksPublished;
        for (const track of participant.tracks) {
          if (tracks[track.sid] !== undefined) {
            continue;
          }
          tracks[track.sid] = {
            sid: track.sid,
            height: track.height,
            width: track.width,
            mimeType: track.mimeType,
            timestamp: new Date().getTime(),
          };
        }
      }
      room.updatedAt = new Date().getTime();
      await db.room.replace(room);
      break;
    case "room_started":
    case "room_finished":
      room.events.push({
        eventName: event.event,
        timestamp: new Date().getTime(),
      });
      room.updatedAt = new Date().getTime();
      await db.room.replace(room);
      break;
    case "egress_started":
    case "egress_ended":
      // TODO
      break;
  }

  return res.status(204).end();
});

export default app;
