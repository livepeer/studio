import apiToken from "./api-token";
import auth from "./auth";
import broadcaster from "./broadcaster";
import experiment from "./experiment";
import ingest from "./ingest";
import objectStore from "./object-store";
import accessControl from "./access-control";
import clip from "./clip";
import multistream from "./multistream";
import orchestrator from "./orchestrator";
import stream from "./stream";
import user from "./user";
import geolocate from "./geolocate";
import webhook from "./webhook";
import asset from "./asset";
import task from "./task";
import transcode from "./transcode";
import stripe from "./stripe";
import version from "./version";
import admin from "./admin";
import usage from "./usage";
import region from "./region";
import session from "./session";
import playback from "./playback";
import did from "./did";
import room from "./room";
import project from "./project";

// Annoying but necessary to get the routing correct
export default {
  "api-token": apiToken,
  auth,
  broadcaster,
  experiment,
  "object-store": objectStore,
  multistream,
  orchestrator,
  stream,
  user,
  geolocate,
  ingest,
  webhook,
  asset,
  task,
  transcode,
  "access-control": accessControl,
  region,
  stripe,
  version,
  admin,
  usage,
  session,
  playback,
  did,
  room,
  clip,
  project,
};
