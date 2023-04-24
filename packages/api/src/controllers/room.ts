import { Router } from "express";
import { RoomServiceClient } from "livekit-server-sdk";
import { v4 as uuid } from "uuid";
import { authorizer } from "../middleware";

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
  const opts = {
    name: id,
    // timeout in seconds
    emptyTimeout: 30 * 60,
    maxParticipants: 2,
  };
  const room = await svc.createRoom(opts);
  console.log("livekit room created", room);
  res.status(201);
  res.json({
    id: id,
  });
});

export default app;
