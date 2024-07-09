import accessControl from "./access-control";
import admin from "./admin";
import apiToken from "./api-token";
import asset from "./asset";
import auth from "./auth";
import broadcaster from "./broadcaster";
import clip from "./clip";
import did from "./did";
import experiment from "./experiment";
import generate from "./generate";
import geolocate from "./geolocate";
import ingest from "./ingest";
import multistream from "./multistream";
import objectStore from "./object-store";
import orchestrator from "./orchestrator";
import playback from "./playback";
import project from "./project";
import region from "./region";
import room from "./room";
import session from "./session";
import stream from "./stream";
import stripe from "./stripe";
import task from "./task";
import transcode from "./transcode";
import usage from "./usage";
import user from "./user";
import version from "./version";
import webhook from "./webhook";

// Annoying but necessary to get the routing correct
export default {
  "access-control": accessControl,
  admin,
  "api-token": apiToken,
  asset,
  auth,
  broadcaster,
  clip,
  did,
  experiment,
  generate,
  geolocate,
  ingest,
  multistream,
  "object-store": objectStore,
  orchestrator,
  playback,
  project,
  region,
  room,
  session,
  stream,
  stripe,
  task,
  transcode,
  usage,
  user,
  version,
  webhook,
};
