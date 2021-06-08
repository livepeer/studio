import apiToken from "./api-token";
import broadcaster from "./broadcaster";
import ingest from "./ingest";
import objectStore from "./object-store";
import pushTarget from "./push-target";
import orchestrator from "./orchestrator";
import stream from "./stream";
import user from "./user";
import geolocate from "./geolocate";
import webhook from "./webhook";
import stripe from "./stripe";
import version from "./version";
import admin from "./admin";
import usage from "./usage";
import region from "./region";
import session from "./session";
import detection from "./detection";

// Annoying but necessary to get the routing correct
export default {
  "api-token": apiToken,
  broadcaster,
  "object-store": objectStore,
  "push-target": pushTarget,
  orchestrator,
  stream,
  user,
  geolocate,
  ingest,
  webhook,
  region,
  stripe,
  version,
  admin,
  usage,
  session,
  detection,
};
