import express, { Router } from "express";
import { RoomServiceClient, WebhookReceiver } from "livekit-server-sdk";
import { v4 as uuid } from "uuid";
import { authorizer } from "../middleware";
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

  if (!req.user.admin && req.user.id !== room.userId) {
    throw new ForbiddenError(`users may only view their own rooms`);
  }

  res.status(200).json(toExternalRoom(room, req.user.admin));
});

function toExternalRoom(room: Room, isAdmin = false) {
  if (isAdmin) {
    return room;
  }
  room.userId = undefined;
  for (const key in room.participants) {
    room.participants[key].tracksPublished = undefined;
  }
  room.events = undefined;
  return room;
}

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
      await db.room.replace(room);
      break;
    case "room_started":
    case "room_finished":
      room.events.push({
        eventName: event.event,
        timestamp: new Date().getTime(),
      });
      await db.room.replace(room);
      break;
  }

  return res.status(204).end();
});

export default app;
