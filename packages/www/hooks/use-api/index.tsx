import { useState, useContext, createContext, useEffect } from "react";
import jwt from "jsonwebtoken";
import { User } from "@livepeer.studio/api";
import { isStaging, isDevelopment } from "../../lib/utils";
import { ApiState } from "./types";
import { clearTokens, getRefreshToken, getStoredToken } from "./tokenStorage";
import * as accessControlEndpointsFunctions from "./endpoints/accessControl";
import * as apiTokenEndpointsFunctions from "./endpoints/apiToken";
import * as assetEndpointsFunctions from "./endpoints/asset";
import * as broadcasterEndpointsFunctions from "./endpoints/broadcaster";
import * as dataEndpointsFunctions from "./endpoints/data";
import * as ingestEndpointsFunctions from "./endpoints/ingest";
import * as multistreamEndpointsFunctions from "./endpoints/multistream";
import * as objectStoreEndpointsFunctions from "./endpoints/objectStore";
import * as sessionEndpointsFunctions from "./endpoints/session";
import * as clipEndpointsFunctions from "./endpoints/clip";
import * as streamEndpointsFunctions from "./endpoints/stream";
import * as taskEndpointsFunctions from "./endpoints/task";
import * as userEndpointsFunctions from "./endpoints/user";
import * as versionEndpointsFunctions from "./endpoints/version";
import * as webhookEndpointsFunctions from "./endpoints/webhook";
import * as projectEndpointsFunctions from "./endpoints/project";
import * as aiEndpointsFunctions from "./endpoints/ai";

// Allow for manual overriding of the API server endopint
export const getEndpoint = () => {
  try {
    const override = localStorage.getItem("LP_API_SERVER_OVERRIDE");
    if (typeof override === "string") {
      return override;
    }
  } catch (e) {
    // not found, no problem
  }
  if (process.env.NEXT_PUBLIC_USE_STAGING_ENDPOINT === "true" || isStaging()) {
    return "https://livepeer.monster";
  }
  if (isDevelopment()) {
    return "http://localhost:3004";
  }
  if (typeof document !== "undefined") {
    return `${document.location.protocol}//${document.location.host}`;
  }
  return "https://livepeer.studio";
};

const endpoint = getEndpoint();

const makeContext = (
  state: ApiState,
  setState: React.Dispatch<React.SetStateAction<ApiState>>,
) => {
  const context = {
    ...state,
    endpoint,

    async fetch(url: string, opts: RequestInit = {}, refreshedToken = "") {
      const headers = new Headers(opts.headers || {});
      const token = refreshedToken || state.token;
      if (token && !headers.has("authorization")) {
        headers.set("authorization", `JWT ${token}`);
      }
      const res = await fetch(`${endpoint}/api${url}`, {
        ...opts,
        headers,
      });
      if (res.status === 204) {
        return [res];
      }

      // todo: not every endpoint will return JSON
      const body = await res.json();
      // todo: this can go away once we standardize on body.errors
      if (!Array.isArray(body.errors) && typeof body.error === "string") {
        body.errors = [body.error];
      }

      const tokenExpired =
        res.status === 401 && body.errors?.[0] === "access token expired";
      if (tokenExpired && !refreshedToken) {
        const newToken = await userEndpointsFunctions.refreshAccessToken();
        if (newToken) {
          return context.fetch(url, opts, newToken);
        }
      }

      return [res, body];
    },

    ...accessControlEndpointsFunctions,
    ...apiTokenEndpointsFunctions,
    ...assetEndpointsFunctions,
    ...broadcasterEndpointsFunctions,
    ...dataEndpointsFunctions,
    ...ingestEndpointsFunctions,
    ...multistreamEndpointsFunctions,
    ...objectStoreEndpointsFunctions,
    ...sessionEndpointsFunctions,
    ...clipEndpointsFunctions,
    ...streamEndpointsFunctions,
    ...taskEndpointsFunctions,
    ...userEndpointsFunctions,
    ...versionEndpointsFunctions,
    ...webhookEndpointsFunctions,
    ...projectEndpointsFunctions,
    ...aiEndpointsFunctions,
  };

  accessControlEndpointsFunctions.setSharedScope(context, setState);
  apiTokenEndpointsFunctions.setSharedScope(context, setState);
  assetEndpointsFunctions.setSharedScope(context, setState);
  broadcasterEndpointsFunctions.setSharedScope(context, setState);
  dataEndpointsFunctions.setSharedScope(context, setState);
  ingestEndpointsFunctions.setSharedScope(context, setState);
  multistreamEndpointsFunctions.setSharedScope(context, setState);
  objectStoreEndpointsFunctions.setSharedScope(context, setState);
  sessionEndpointsFunctions.setSharedScope(context, setState);
  clipEndpointsFunctions.setSharedScope(context, setState);
  streamEndpointsFunctions.setSharedScope(context, setState);
  taskEndpointsFunctions.setSharedScope(context, setState);
  userEndpointsFunctions.setSharedScope(context, setState);
  versionEndpointsFunctions.setSharedScope(context, setState);
  webhookEndpointsFunctions.setSharedScope(context, setState);
  projectEndpointsFunctions.setSharedScope(context, setState);
  aiEndpointsFunctions.setSharedScope(context, setState);

  delete context.setSharedScope;

  return context;
};

export const ApiContext = createContext(makeContext({} as ApiState, () => {}));

export const ApiProvider = ({ children }) => {
  const [state, setState] = useState<ApiState>({
    token: getStoredToken(),
    refreshToken: getRefreshToken(),
  });

  const context = makeContext(state, setState);

  // If our token changes, auto-refresh our current user
  useEffect(() => {
    if (state.token) {
      const data = jwt.decode(state.token);
      context.getUser(data.sub).then(async ([res, user]) => {
        if (res.status !== 200) {
          clearTokens();
          setState((state) => ({ ...state, token: null, refreshToken: null }));
        } else {
          setState((state) => ({ ...state, user: user as User }));
          // migrate old JWT to refresh-token scheme if needed
          if (!state.refreshToken) {
            await userEndpointsFunctions.refreshAccessToken();
          }
        }
      });
    }
  }, [state.token, state.userRefresh]);

  return <ApiContext.Provider value={context}>{children}</ApiContext.Provider>;
};

export default function useApi() {
  return useContext(ApiContext);
}
