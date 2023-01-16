import apiToken from "./api-token";
import auth from "./auth";
import broadcaster from "./broadcaster";
import experiment from "./experiment";
import ingest from "./ingest";
import objectStore from "./object-store";
import accessControl from "./access-control";
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
import cdnData from "./cdn-data";
import playback from "./playback";

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
  "cdn-data": cdnData,
  playback,
};
