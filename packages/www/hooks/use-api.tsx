import { useState, useContext, createContext, useEffect } from "react";
import fetch from "isomorphic-fetch";
import jwt from "jsonwebtoken";
import {
  User,
  Error as ApiError,
  ApiToken,
  Stream,
  Webhook
} from "@livepeer.com/api";
import qs from "qs";

/**
 * Primary React API client. Definitely a "first pass". Should be replaced with some
 * helpers around a nice auto-generated TypeScript client from our Swagger schema.
 */

declare global {
  interface Window {
    _hsq: any;
  }
}

type ApiState = {
  user?: User;
  token?: string;
  userRefresh?: number;
};

export interface UsageData {
  sourceSegments: number;
  transcodedSegments: number;
  sourceSegmentsDuration: number;
  transcodedSegmentsDuration: number;
}

export interface StreamInfo {
  stream: Stream;
  session?: Stream;
  isPlaybackid: boolean;
  isSession: boolean;
  isStreamKey: boolean;
  user: User;
}

export interface Ingest {
  ingest: string;
  playback: string;
  base: string;
}

const PERSISTENT_TOKEN = "PERSISTENT_TOKEN";
const storeToken = (token) => {
  try {
    localStorage.setItem(PERSISTENT_TOKEN, token);
  } catch (err) {
    console.error(`
      Error storing persistent token: ${err.message}. Usually this means that you're in a
      Safari private window and you don't want the token to persist anyway.
    `);
  }
};

const trackPageView = (email, path = null) => {
  var _hsq = (window._hsq = window._hsq || []);
  _hsq.push(["identify", { email: email }]);
  if (path) {
    _hsq.push(["setPath", path]);
  }
  _hsq.push(["trackPageView"]);
};

const getStoredToken = () => {
  if (!process.browser) {
    return null;
  }
  try {
    return localStorage.getItem(PERSISTENT_TOKEN);
  } catch (err) {
    console.error(`Error retrieving persistent token: ${err.message}.`);
    return null;
  }
};

const clearToken = () => {
  try {
    localStorage.removeItem(PERSISTENT_TOKEN);
  } catch (err) {
    console.error(`Error clearing persistent token: ${err.message}.`);
  }
};

const makeContext = (state: ApiState, setState) => {
  const context = {
    ...state,
    async fetch(url, opts: RequestInit = {}) {
      let headers = new Headers(opts.headers || {});
      if (state.token && !headers.has("authorization")) {
        headers.set("authorization", `JWT ${state.token}`);
      }
      const endpoint =
        window.location.hostname.includes("livepeer.monster") ||
        window.location.hostname.includes("livepeerorg.vercel.app") ||
        window.location.hostname.includes("livepeerorg.now.sh")
          ? `https://mdw.livepeer.monster/api${url}`
          : `/api${url}`;
      const res = await fetch(endpoint, {
        ...opts,
        headers
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
      return [res, body];
    },

    async login(email, password) {
      trackPageView(email);
      const [res, body] = await context.fetch("/user/token", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: {
          "content-type": "application/json"
        }
      });
      if (res.status !== 201) {
        return body;
      }
      const { token } = body;
      storeToken(token);

      if (process.env.NODE_ENV === "production") {
        const data = jwt.decode(token);
        window.analytics.identify(data.sub, {
          email: email
        });
      }

      setState((state) => ({ ...state, token }));
      return res;
    },

    async register({
      email,
      password,
      selectedPlan = 0,
      firstName = null,
      lastName = null,
      phone = null,
      organization = null
    }) {
      trackPageView(email);
      const [res, body] = await context.fetch(
        `/user?selectedPlan=${selectedPlan}`,
        {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(organization && { organization }),
            ...(phone && { phone })
          }),
          headers: {
            "content-type": "application/json"
          }
        }
      );
      if (res.status !== 201) {
        return body;
      }
      // Create stripe customer
      const customer: any = await context.createCustomer(email);

      // Subscribe customer to free plan upon registation
      await context.createSubscription({
        stripeCustomerId: customer.id,
        stripeProductId: "prod_0"
      });

      return context.login(email, password);
    },

    async verify(email, emailValidToken) {
      trackPageView(email);
      const res = await context.fetch("/user/verify", {
        method: "POST",
        body: JSON.stringify({ email, emailValidToken }),
        headers: {
          "content-type": "application/json"
        }
      });
      setState({ ...state, userRefresh: Date.now() });
    },

    async makePasswordResetToken(email) {
      trackPageView(email);
      const [res, body] = await context.fetch("/user/password/reset-token", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: {
          "content-type": "application/json"
        }
      });
      return body;
    },

    async resetPassword(email, resetToken, password) {
      trackPageView(email);
      const [res, body] = await context.fetch("/user/password/reset", {
        method: "POST",
        body: JSON.stringify({ email, resetToken, password }),
        headers: {
          "content-type": "application/json"
        }
      });
      if (res.status !== 201) {
        return body;
      }
      return context.login(email, password);
    },

    async getUser(userId, opts = {}): Promise<[Response, User | ApiError]> {
      const [res, user] = await context.fetch(`/user/${userId}`, opts);
      return [res, user as User | ApiError];
    },

    async getUsers(limit = 100, opts = {}): Promise<Array<User> | ApiError> {
      let [res, users] = await context.fetch(`/user?limit=${limit}`, opts);

      if (res.status === 200) {
        return users;
      }
      return res;
    },

    async getUsage(
      fromTime: number,
      toTime: number,
      userId?: number
    ): Promise<[Response, UsageData | ApiError]> {
      let [res, usage] = await context.fetch(
        `/user/usage?${qs.stringify({ fromTime, toTime, userId })}`,
        {}
      );

      return [res, usage as UsageData | ApiError];
    },

    async makeUserAdmin(email, admin): Promise<[Response, User | ApiError]> {
      const [res, body] = await context.fetch("/user/make-admin", {
        method: "POST",
        body: JSON.stringify({ email: email, admin: admin }),
        headers: {
          "content-type": "application/json"
        }
      });

      setState({ ...state, userRefresh: Date.now() });

      if (res.status !== 201) {
        return body;
      }

      return res;
    },

    async createCustomer(email): Promise<[Response, User | ApiError]> {
      const [, body] = await context.fetch("/user/create-customer", {
        method: "POST",
        body: JSON.stringify({ email: email }),
        headers: {
          "content-type": "application/json"
        }
      });

      return body;
    },

    async updateUser(id, fields): Promise<[Response, User | ApiError]> {
      const [res, body] = await context.fetch(`/user/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...fields }),
        headers: {
          "content-type": "application/json"
        }
      });

      if (res.status !== 201) {
        return body;
      }

      return res;
    },

    async createSubscription({
      stripeCustomerId,
      stripeProductId
    }): Promise<[Response, User | ApiError]> {
      const [res, body] = await context.fetch("/user/create-subscription", {
        method: "POST",
        body: JSON.stringify({
          stripeCustomerId,
          stripeProductId
        }),
        headers: {
          "content-type": "application/json"
        }
      });
      setState({ ...state, userRefresh: Date.now() });

      if (res.status !== 201) {
        return body;
      }

      return res;
    },

    async updateSubscription({
      stripeCustomerId,
      stripeCustomerSubscriptionId,
      stripeProductId,
      stripeCustomerPaymentMethodId = null
    }): Promise<[Response, User | ApiError]> {
      const [res, body] = await context.fetch("/user/update-subscription", {
        method: "POST",
        body: JSON.stringify({
          stripeCustomerId,
          stripeCustomerSubscriptionId,
          stripeProductId,
          ...(stripeCustomerPaymentMethodId && {
            stripeCustomerPaymentMethodId
          })
        }),
        headers: {
          "content-type": "application/json"
        }
      });
      setState({ ...state, userRefresh: Date.now() });

      if (res.status !== 201) {
        return body;
      }

      return res;
    },

    async getSubscription(
      stripeCustomerSubscriptionId: string
    ): Promise<[Response, ApiError]> {
      let [res, subscription] = await context.fetch(
        `/user/retrieve-subscription`,
        {
          method: "POST",
          body: JSON.stringify({
            stripeCustomerSubscriptionId
          }),
          headers: {
            "content-type": "application/json"
          }
        }
      );

      return [res, subscription];
    },

    async getInvoices(stripeCustomerId: string): Promise<[Response, ApiError]> {
      let [res, invoice] = await context.fetch(`/user/retrieve-invoices`, {
        method: "POST",
        body: JSON.stringify({
          stripeCustomerId
        }),
        headers: {
          "content-type": "application/json"
        }
      });

      return [res, invoice];
    },

    async updateCustomerPaymentMethod({
      stripeCustomerId,
      stripeCustomerPaymentMethodId
    }): Promise<[Response, User | ApiError]> {
      const [res, body] = await context.fetch(
        "/user/update-customer-payment-method",
        {
          method: "POST",
          body: JSON.stringify({
            stripeCustomerId,
            stripeCustomerPaymentMethodId
          }),
          headers: {
            "content-type": "application/json"
          }
        }
      );

      if (res.status !== 201) {
        return body;
      }

      return res;
    },

    async logout() {
      setState((state) => ({ ...state, user: null, token: null }));
      clearToken();
    },

    async getBroadcasters(): Promise<Array<{ address: string }>> {
      const [res, broadcasters] = await context.fetch(`/broadcaster`);
      if (res.status !== 200) {
        throw new Error(broadcasters);
      }
      return broadcasters;
    },

    async getIngest(all = false): Promise<Array<Ingest>> {
      const q = all ? "?first=false" : "";
      const [res, ingest] = await context.fetch(`/ingest${q}`);
      if (res.status !== 200) {
        throw new Error(ingest);
      }
      return ingest;
    },

    async getStreamInfo(
      id: string
    ): Promise<[Response, StreamInfo | ApiError]> {
      let [res, info] = await context.fetch(`/stream/${id}/info`);

      return [res, info as StreamInfo | ApiError];
    },

    async getStream(streamId): Promise<Stream> {
      const [res, stream] = await context.fetch(`/stream/${streamId}`);
      if (res.status !== 200) {
        throw stream && typeof stream === "object"
          ? { ...stream, status: res.status }
          : new Error(stream);
      }
      return stream;
    },

    async getAdminStreams(active = false): Promise<Array<Stream>> {
      let url = `/stream?streamsonly=1`;
      if (active) {
        url += `&active=1`;
      }
      const [res, streams] = await context.fetch(url);
      if (res.status !== 200) {
        throw new Error(streams);
      }
      return streams.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
    },

    async getStreams(userId): Promise<Array<Stream>> {
      const [res, streams] = await context.fetch(
        `/stream/user/${userId}?streamsonly=1`
      );
      if (res.status !== 200) {
        throw new Error(streams);
      }
      return streams.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
    },

    async createStream(params): Promise<Stream> {
      const [res, stream] = await context.fetch(`/stream`, {
        method: "POST",
        body: JSON.stringify(params),
        headers: {
          "content-type": "application/json"
        }
      });

      if (res.status !== 201) {
        throw new Error(stream.errors.join(", "));
      }
      return stream;
    },

    async getStreamSessions(id): Promise<Array<Stream>> {
      const [res, streams] = await context.fetch(`/stream/sessions/${id}`);
      if (res.status !== 200) {
        throw new Error(streams);
      }
      return streams.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
    },

    async deleteStream(id: string): Promise<void> {
      const [res, body] = await context.fetch(`/stream/${id}`, {
        method: "DELETE"
      });
      if (res.status !== 204) {
        throw new Error(body);
      }
    },

    async setRecord(
      streamId: string,
      record: boolean
    ): Promise<[void | ApiError]> {
      const [res, body] = await context.fetch(`/stream/${streamId}/record`, {
        method: "PATCH",
        body: JSON.stringify({ record }),
        headers: {
          "content-type": "application/json"
        }
      });

      if (res.status !== 204) {
        throw new Error(res.body ? body : `http status ${res.status}`);
      }

      return res;
    },

    async getWebhooks(allUsers, all: boolean): Promise<Array<Webhook>> {
      let uri = `/webhook?`;
      if (allUsers) {
        uri += `allUsers=1`;
      }
      if (all) {
        uri += `&all=1`;
      }
      const [res, webhooks] = await context.fetch(uri);
      if (res.status !== 200) {
        throw new Error(webhooks);
      }
      return webhooks.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    },

    async createWebhook(params): Promise<Webhook> {
      const [res, webhook] = await context.fetch(`/webhook`, {
        method: "POST",
        body: JSON.stringify(params),
        headers: {
          "content-type": "application/json"
        }
      });

      if (res.status !== 201) {
        throw new Error(webhook.errors.join(", "));
      }
      return webhook;
    },

    async deleteWebhook(id: string): Promise<void> {
      const [res, body] = await context.fetch(`/webhook/${id}`, {
        method: "DELETE"
      });
      if (res.status !== 204) {
        throw new Error(body.errors.join(", "));
      }
    },

    async getApiTokens(userId?: string): Promise<[ApiToken]> {
      const [res, tokens] = await context.fetch(
        `/api-token?${qs.stringify({ userId })}`
      );
      if (res.status !== 200) {
        throw new Error(tokens);
      }
      return tokens;
    },

    async createApiToken(params): Promise<ApiToken> {
      trackPageView(params.email, "/create-api-token");
      const [res, token] = await context.fetch(`/api-token`, {
        method: "POST",
        body: JSON.stringify(params),
        headers: {
          "content-type": "application/json"
        }
      });
      if (res.status !== 201) {
        throw new Error(JSON.stringify(res.errors));
      }
      return token;
    },

    async deleteApiToken(id: string): Promise<void> {
      const [res, body] = await context.fetch(`/api-token/${id}`, {
        method: "DELETE"
      });
      if (res.status !== 204) {
        throw new Error(body);
      }
    }
  };
  return context;
};

export const ApiContext = createContext(makeContext({} as ApiState, () => {}));

export const ApiProvider = ({ children }) => {
  const [state, setState] = useState<ApiState>({
    token: getStoredToken()
  });

  const context = makeContext(state, setState);

  // If our token changes, auto-refresh our current user
  useEffect(() => {
    if (state.token) {
      const data = jwt.decode(state.token);
      context.getUser(data.sub).then(([res, user]) => {
        if (res.status !== 200) {
          clearToken();
          setState((state) => ({ ...state, token: null }));
        } else {
          setState((state) => ({ ...state, user: user as User }));
        }
      });
    }
  }, [state.token, state.userRefresh]);

  return <ApiContext.Provider value={context}>{children}</ApiContext.Provider>;
};

export default function useApi() {
  return useContext(ApiContext);
}
