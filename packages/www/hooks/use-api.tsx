import { useState, useContext, createContext, useEffect } from "react";
import jwt from "jsonwebtoken";
import {
  User,
  Error as ApiError,
  ApiToken,
  MultistreamTarget,
  Stream,
  Webhook,
  StreamPatchPayload,
  ObjectStore,
  MultistreamTargetPatchPayload,
  Asset,
  Task,
  SuspendUserPayload,
} from "@livepeer.com/api";
import qs from "qs";
import { isStaging, isDevelopment, HttpError } from "../lib/utils";
import Head from "next/head";
import { products } from "@livepeer.com/api/src/config";

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
  noStripe?: boolean;
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

export interface Version {
  tag: string;
  commit: string;
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

export const DashboardRedirect = () => {
  return (
    <Head>
      <script
        dangerouslySetInnerHTML={{
          __html: `
  if (!window.localStorage || !window.localStorage.getItem('${PERSISTENT_TOKEN}')) {
      location.replace('/login?next=' + encodeURIComponent(
        location.pathname + location.search
      ))
  }
  `,
        }}
      />
    </Head>
  );
};

const clearToken = () => {
  try {
    localStorage.removeItem(PERSISTENT_TOKEN);
  } catch (err) {
    console.error(`Error clearing persistent token: ${err.message}.`);
  }
};

const linkRE = new RegExp("<.[^?]?([^>]*)>");

const getCursor = (link?: string): string => {
  if (!link) {
    return "";
  }
  const match = link.match(linkRE);
  if (!match) {
    return "";
  }
  const { cursor } = qs.parse(match[1]);
  return cursor?.toString() ?? "";
};

const hasStripe = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const makeContext = (state: ApiState, setState) => {
  const context = {
    ...state,
    async fetch(url, opts: RequestInit = {}) {
      let headers = new Headers(opts.headers || {});
      if (state.token && !headers.has("authorization")) {
        headers.set("authorization", `JWT ${state.token}`);
      }

      let endpoint = isStaging()
        ? `https://livepeer.monster/api${url}`
        : `/api${url}`;

      if (isDevelopment()) {
        endpoint = `http://localhost:3004/api${url}`;
      }

      const res = await fetch(endpoint, {
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
      return [res, body];
    },

    async login(email, password) {
      trackPageView(email);
      const [res, body] = await context.fetch("/user/token", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: {
          "content-type": "application/json",
        },
      });
      if (res.status !== 201) {
        return body;
      }
      const { token } = body;
      storeToken(token);

      if (process.env.NODE_ENV === "production") {
        const data = jwt.decode(token, { json: true });
        window.analytics.identify(data.sub, { email });
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
      organization = null,
      recaptchaToken,
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
            ...(phone && { phone }),
            recaptchaToken,
          }),
          headers: {
            "content-type": "application/json",
          },
        }
      );
      if (res.status !== 201) {
        return body;
      }

      // Only create stripe customer if developer explicitly enables stripe in dev mode
      if (
        process.env.NODE_ENV === "development" &&
        !process.env.NEXT_PUBLIC_STRIPE_ENABLED_IN_DEV_MODE
      ) {
        return context.login(email, password);
      }

      // Create stripe customer
      const customer = await context.createCustomer(email);

      // Subscribe customer to free plan upon registation
      await context.createSubscription({
        stripeCustomerId: customer.id,
        stripeProductId: "prod_0",
      });

      return context.login(email, password);
    },

    async verify(email, emailValidToken) {
      trackPageView(email);
      const [res, body] = await context.fetch("/user/verify", {
        method: "POST",
        body: JSON.stringify({ email, emailValidToken }),
        headers: {
          "content-type": "application/json",
        },
      });

      setState({ ...state, userRefresh: Date.now() });

      if (res.status !== 201) {
        throw new Error(body.errors[0]);
      }
    },

    // resend verify email
    async verifyEmail(email) {
      const [res, body] = await context.fetch("/user/verify-email", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: {
          "content-type": "application/json",
        },
      });

      return body;
    },

    async makePasswordResetToken(email) {
      trackPageView(email);
      const [res, body] = await context.fetch("/user/password/reset-token", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: {
          "content-type": "application/json",
        },
      });
      return body;
    },

    async resetPassword(email, resetToken, password) {
      trackPageView(email);
      const [res, body] = await context.fetch("/user/password/reset", {
        method: "POST",
        body: JSON.stringify({ email, resetToken, password }),
        headers: {
          "content-type": "application/json",
        },
      });
      if (res.status !== 201) {
        return body;
      }
      return context.login(email, password);
    },

    async getUser(userId, opts = {}): Promise<[Response, User | ApiError]> {
      let [res, user] = await context.fetch(`/user/${userId}`, opts);
      if (isDevelopment() && hasStripe && !user.stripeProductId && user.email) {
        const customer = await context.createCustomer(user.email);
        await context.createSubscription({
          stripeCustomerId: customer.id,
          stripeProductId: "prod_0",
        });
        [res, user] = await context.fetch(`/user/${userId}`, opts);
      }
      return [res, user as User | ApiError];
    },

    // Get current Stripe product, allowing for development users that don't have any
    getUserProduct(user: User) {
      if (hasStripe) {
        return products[user.stripeProductId];
      }
      return products[user.stripeProductId || "prod_0"];
    },

    async getUsers(
      limit = 100,
      cursor?: string,
      order?: string,
      filters?: Array<{ id: string; value: string }>
    ): Promise<[Array<User> | ApiError, string, Response]> {
      const f = filters ? JSON.stringify(filters) : undefined;
      const uri = `/user?${qs.stringify({ limit, cursor, filters: f, order })}`;
      let [res, users] = await context.fetch(uri);

      const nextCursor = getCursor(res.headers.get("link"));
      return [users, nextCursor, res];
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
          "content-type": "application/json",
        },
      });

      setState({ ...state, userRefresh: Date.now() });

      if (res.status !== 201) {
        return body;
      }

      return res;
    },

    async setUserSuspended(
      userId: string,
      payload: SuspendUserPayload
    ): Promise<[Response, ApiError]> {
      const [res, body] = await context.fetch(`/user/${userId}/suspended`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        headers: {
          "content-type": "application/json",
        },
      });

      if (res.status !== 204) {
        if (body && body.errors) {
          return [res, body];
        }
        return [
          res,
          { errors: [res.body ? `${body}` : `http status ${res.status}`] },
        ];
      }
      return [res, null];
    },

    async createCustomer(email): Promise<{ id: string } | ApiError> {
      if (!hasStripe) {
        return;
      }
      const [res, body] = await context.fetch("/user/create-customer", {
        method: "POST",
        body: JSON.stringify({ email: email }),
        headers: {
          "content-type": "application/json",
        },
      });

      return body;
    },

    async createSubscription({
      stripeCustomerId,
      stripeProductId,
    }): Promise<User | ApiError> {
      if (!hasStripe) {
        return;
      }
      const [res, body] = await context.fetch("/user/create-subscription", {
        method: "POST",
        body: JSON.stringify({
          stripeCustomerId,
          stripeProductId,
        }),
        headers: {
          "content-type": "application/json",
        },
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
      stripeCustomerPaymentMethodId = null,
    }): Promise<[Response, User | ApiError]> {
      const [res, body] = await context.fetch("/user/update-subscription", {
        method: "POST",
        body: JSON.stringify({
          stripeCustomerId,
          stripeCustomerSubscriptionId,
          stripeProductId,
          ...(stripeCustomerPaymentMethodId && {
            stripeCustomerPaymentMethodId,
          }),
        }),
        headers: {
          "content-type": "application/json",
        },
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
            stripeCustomerSubscriptionId,
          }),
          headers: {
            "content-type": "application/json",
          },
        }
      );

      return [res, subscription];
    },

    async getInvoices(stripeCustomerId: string): Promise<[Response, ApiError]> {
      let [res, invoice] = await context.fetch(`/user/retrieve-invoices`, {
        method: "POST",
        body: JSON.stringify({
          stripeCustomerId,
        }),
        headers: {
          "content-type": "application/json",
        },
      });

      return [res, invoice];
    },

    async getPaymentMethod(
      stripePaymentMethodId: string
    ): Promise<[Response, PaymentMethodData | ApiError]> {
      let [res, paymentMethod] = await context.fetch(
        `/user/retrieve-payment-method`,
        {
          method: "POST",
          body: JSON.stringify({
            stripePaymentMethodId,
          }),
          headers: {
            "content-type": "application/json",
          },
        }
      );
      return [res, paymentMethod];
    },

    async updateCustomerPaymentMethod({
      stripeCustomerId,
      stripeCustomerPaymentMethodId,
    }): Promise<[Response, User | ApiError]> {
      const [res, body] = await context.fetch(
        "/user/update-customer-payment-method",
        {
          method: "POST",
          body: JSON.stringify({
            stripeCustomerId,
            stripeCustomerPaymentMethodId,
          }),
          headers: {
            "content-type": "application/json",
          },
        }
      );

      setState({ ...state, userRefresh: Date.now() });

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

    async getAdminStreams({
      active,
      nonLivepeerOnly,
      userId,
      order,
      filters,
      limit,
      cursor,
      sessionsonly,
    }: {
      active?: boolean;
      nonLivepeerOnly?: boolean;
      userId?: string;
      order?: string;
      filters?: Array<{ id: string; value: string }>;
      limit?: number;
      cursor?: string;
      sessionsonly?: boolean;
    }): Promise<[Array<Stream> | ApiError, string, Response]> {
      const f = filters ? JSON.stringify(filters) : undefined;
      const streamsonly = !sessionsonly ? true : undefined;
      const [res, streams] = await context.fetch(
        `/stream?${qs.stringify({
          active,
          streamsonly,
          order,
          limit,
          cursor,
          filters: f,
          nonLivepeerOnly,
          userId,
          sessionsonly,
        })}`
      );
      const nextCursor = getCursor(res.headers.get("link"));
      return [streams, nextCursor, res];
    },

    async getStreams(
      userId: string,
      opts?: {
        filters?: Array<{ id: string; value: string | object }>;
        limit?: number | string;
        cursor?: string;
        order?: string;
        active?: boolean;
        count?: boolean;
      }
    ): Promise<[Stream[], string, number]> {
      const filters = opts?.filters ? JSON.stringify(opts?.filters) : undefined;
      const [res, streams] = await context.fetch(
        `/stream?${qs.stringify({
          userId,
          filters,
          active: opts?.active,
          order: opts?.order,
          limit: opts?.limit,
          cursor: opts?.cursor,
          count: opts?.count,
          streamsonly: 1,
        })}`
      );
      if (res.status !== 200) {
        throw new Error(streams);
      }
      const nextCursor = getCursor(res.headers.get("link"));
      const count = res.headers.get("X-Total-Count");
      return [streams, nextCursor, count];
    },

    async createStream(params): Promise<Stream> {
      const [res, stream] = await context.fetch(`/stream`, {
        method: "POST",
        body: JSON.stringify(params),
        headers: {
          "content-type": "application/json",
        },
      });

      if (res.status !== 201) {
        throw new Error(stream.errors.join(", "));
      }
      return stream;
    },

    async getStreamSessions(
      id,
      cursor?: string,
      limit: number = 20,
      filters?: Array<{ id: string; value: string | object }>,
      count?: boolean
    ): Promise<[Array<Stream>, string, number]> {
      const stringifiedFilters = filters ? JSON.stringify(filters) : undefined;
      const uri = `/session?${qs.stringify({
        limit,
        cursor,
        parentId: id,
        filters: stringifiedFilters,
        count,
      })}`;
      const [res, streams] = await context.fetch(uri);
      if (res.status !== 200) {
        throw new Error(streams);
      }
      const nextCursor = getCursor(res.headers.get("link"));
      const c = res.headers.get("X-Total-Count");
      return [streams, nextCursor, c];
    },

    async createMultistreamTarget(
      id: string,
      input: Omit<MultistreamTarget, "id">
    ): Promise<MultistreamTarget> {
      const [res, target] = await context.fetch("/multistream/target", {
        method: "POST",
        body: JSON.stringify(input),
        headers: {
          "content-type": "application/json",
        },
      });
      if (res.status !== 201) {
        throw new HttpError(res.status, target);
      }
      return target;
    },

    async getMultistreamTarget(id: string): Promise<MultistreamTarget> {
      const uri = `/multistream/target/${id}`;
      const [res, target] = await context.fetch(uri);
      if (res.status !== 200) {
        throw new HttpError(res.status, target);
      }
      return target;
    },

    async patchMultistreamTarget(
      id: string,
      patch: MultistreamTargetPatchPayload
    ): Promise<void> {
      const [res, body] = await context.fetch(`/multistream/target/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
        headers: {
          "content-type": "application/json",
        },
      });
      if (res.status !== 204) {
        throw new HttpError(res.status, body);
      }
    },

    async deleteMultistreamTarget(id: string): Promise<void> {
      const [res, body] = await context.fetch(`/multistream/target/${id}`, {
        method: "DELETE",
      });
      if (res.status !== 204) {
        throw new HttpError(res.status, body);
      }
    },

    async getStreamSessionsByUserId(
      userId,
      cursor?: string,
      limit: number = 20,
      order?: string,
      filters?: Array<{ id: string; value: string | object }>,
      count?: boolean
    ): Promise<[Array<Stream>, string, number]> {
      const stringifiedFilters = filters ? JSON.stringify(filters) : undefined;
      const uri = `/session?${qs.stringify({
        limit,
        cursor,
        order,
        userId,
        filters: stringifiedFilters,
        count,
      })}`;
      const [res, streams] = await context.fetch(uri);
      if (res.status !== 200) {
        throw new Error(streams);
      }
      const nextCursor = getCursor(res.headers.get("link"));
      const c = res.headers.get("X-Total-Count");
      return [streams, nextCursor, c];
    },

    async terminateStream(id: string): Promise<boolean> {
      const [res, body] = await context.fetch(`/stream/${id}/terminate`, {
        method: "DELETE",
      });
      if (res.status !== 200) {
        if (body && body.errors) {
          throw new Error(body.errors);
        }
        throw new Error(body);
      }
      if (body && body.errors) {
        throw new Error(body.errors);
      }
      return body.result;
    },

    async deleteStream(id: string): Promise<void> {
      const [res, body] = await context.fetch(`/stream/${id}`, {
        method: "DELETE",
      });
      if (res.status !== 204) {
        throw new Error(body);
      }
    },

    async deleteStreams(ids: Array<string>): Promise<void> {
      const [res, body] = await context.fetch(`/stream`, {
        method: "DELETE",
        body: JSON.stringify({ ids }),
        headers: {
          "content-type": "application/json",
        },
      });
      if (res.status !== 204) {
        throw new Error(body);
      }
    },

    async patchStream(
      streamId: string,
      patch: StreamPatchPayload
    ): Promise<void> {
      const [res, body] = await context.fetch(`/stream/${streamId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
        headers: {
          "content-type": "application/json",
        },
      });
      if (res.status !== 204) {
        throw new HttpError(res.status, body);
      }
      return res;
    },

    async createAsset(params): Promise<Asset> {
      const [res, asset] = await context.fetch(`/asset/import`, {
        method: "POST",
        body: JSON.stringify(params),
        headers: {
          "content-type": "application/json",
        },
      });

      if (res.status !== 201) {
        throw new Error(asset.errors.join(", "));
      }
      return asset;
    },

    async getAssets(
      userId: string,
      opts?: {
        filters?: Array<{ id: string; value: string | object }>;
        limit?: number | string;
        cursor?: string;
        order?: string;
        active?: boolean;
        count?: boolean;
      }
    ): Promise<[Asset[], string, number]> {
      const filters = opts?.filters ? JSON.stringify(opts?.filters) : undefined;
      const [res, assets] = await context.fetch(
        `/asset?${qs.stringify({
          userId,
          filters,
          active: opts?.active,
          order: opts?.order,
          limit: opts?.limit,
          cursor: opts?.cursor,
          count: opts?.count,
          streamsonly: 1,
        })}`
      );
      if (res.status !== 200) {
        throw new Error(assets);
      }
      const nextCursor = getCursor(res.headers.get("link"));
      const count = res.headers.get("X-Total-Count");
      return [assets, nextCursor, count];
    },

    async getTasks(
      userId,
      opts?: {
        filters?: Array<{ id: string; value: string | object }>;
        limit?: number | string;
        cursor?: string;
        order?: string;
        active?: boolean;
        count?: boolean;
      }
    ): Promise<[Array<Task>, string, number]> {
      const filters = opts?.filters ? JSON.stringify(opts?.filters) : undefined;

      const [res, tasks] = await context.fetch(
        `/task?${qs.stringify({
          userId,
          filters,
          order: opts?.order,
          limit: opts?.limit,
          cursor: opts?.cursor,
          count: opts?.count,
        })}`
      );

      if (res.status !== 200) {
        throw new Error(tasks);
      }
      const nextCursor = getCursor(res.headers.get("link"));
      const count = res.headers.get("X-Total-Count");
      return [tasks, nextCursor, count];
    },

    async getObjectStore(
      userId?: string,
      order?: string,
      filters?: Array<{ id: string; value: string }>,
      limit?: number,
      cursor?: string
    ): Promise<[Array<Webhook> | ApiError, string, Response]> {
      const f = filters ? JSON.stringify(filters) : undefined;
      const [res, streams] = await context.fetch(
        `/object-store?${qs.stringify({
          userId,
          order,
          limit,
          cursor,
          filters: f,
        })}`
      );
      const nextCursor = getCursor(res.headers.get("link"));
      return [streams, nextCursor, res];
    },

    async createObjectStore(params): Promise<ObjectStore> {
      const [res, objectStore] = await context.fetch(`/object-store`, {
        method: "POST",
        body: JSON.stringify(params),
        headers: {
          "content-type": "application/json",
        },
      });

      if (res.status !== 201) {
        throw new Error(objectStore.errors.join(", "));
      }
      return objectStore;
    },

    async disableObjectStore(
      id: string,
      disabled: boolean
    ): Promise<[Response, boolean | ApiError]> {
      const [res, body] = await context.fetch(`/object-store/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ disabled }),
        headers: {
          "content-type": "application/json",
        },
      });

      if (res.status !== 204) {
        return [res, true];
      }
      if (body && body.errors) {
        return [res, body];
      }
      return [res, false];
    },

    async getWebhooks(
      allUsers: boolean,
      all: boolean,
      order?: string,
      filters?: Array<{ id: string; value: string | object }>,
      limit?: number,
      cursor?: string,
      count?: boolean
    ): Promise<[Webhook[], string, Response, number]> {
      const f = filters ? JSON.stringify(filters) : undefined;
      const [res, streams] = await context.fetch(
        `/webhook?${qs.stringify({
          allUsers: allUsers ? true : undefined,
          all: all ? true : undefined,
          order,
          limit,
          cursor,
          filters: f,
          count,
        })}`
      );
      const nextCursor = getCursor(res.headers.get("link"));
      const c = res.headers.get("X-Total-Count");
      return [streams, nextCursor, res, c];
    },

    async getWebhook(webhookId): Promise<Webhook> {
      const [res, webhook] = await context.fetch(`/webhook/${webhookId}`);
      if (res.status !== 200) {
        throw webhook && typeof webhook === "object"
          ? { ...webhook, status: res.status }
          : new Error(webhook);
      }
      return webhook;
    },

    async createWebhook(params): Promise<Webhook> {
      const [res, webhook] = await context.fetch(`/webhook`, {
        method: "POST",
        body: JSON.stringify(params),
        headers: {
          "content-type": "application/json",
        },
      });

      if (res.status !== 201) {
        throw new Error(webhook.errors.join(", "));
      }
      return webhook;
    },

    async updateWebhook(id, params): Promise<Webhook> {
      const [res, webhook] = await context.fetch(`/webhook/${id}`, {
        method: "PUT",
        body: JSON.stringify(params),
        headers: {
          "content-type": "application/json",
        },
      });

      if (res.status !== 200) {
        throw new Error(webhook.errors.join(", "));
      }
      return webhook;
    },

    async deleteWebhook(id: string): Promise<void> {
      const [res, body] = await context.fetch(`/webhook/${id}`, {
        method: "DELETE",
      });
      if (res.status !== 204) {
        throw new Error(body.errors.join(", "));
      }
    },

    async deleteWebhooks(ids: Array<string>): Promise<void> {
      const [res, body] = await context.fetch(`/webhook`, {
        method: "DELETE",
        body: JSON.stringify({ ids }),
        headers: {
          "content-type": "application/json",
        },
      });
      if (res.status !== 204) {
        throw new Error(body);
      }
    },

    async getApiTokens(
      userId?: string,
      opts?: {
        filters?: Array<{ id: string; value: string | object }>;
        limit?: number;
        cursor?: string;
        order?: string;
        count?: boolean;
      }
    ): Promise<[Array<ApiToken> | ApiError, string, Response, number]> {
      const filters = opts?.filters ? JSON.stringify(opts?.filters) : undefined;
      const [res, tokens] = await context.fetch(
        `/api-token?${qs.stringify({
          userId,
          filters,
          order: opts?.order,
          limit: opts?.limit,
          cursor: opts?.cursor,
          count: opts?.count,
        })}`
      );
      const nextCursor = getCursor(res.headers.get("link"));
      const count = res.headers.get("X-Total-Count");
      return [tokens, nextCursor, res, count];
    },

    async createApiToken(params): Promise<ApiToken> {
      trackPageView(params.email, "/create-api-token");
      const [res, token] = await context.fetch(`/api-token`, {
        method: "POST",
        body: JSON.stringify(params),
        headers: {
          "content-type": "application/json",
        },
      });
      if (res.status !== 201) {
        throw new Error(JSON.stringify(res.errors));
      }
      return token;
    },

    async deleteApiToken(id: string): Promise<void> {
      const [res, body] = await context.fetch(`/api-token/${id}`, {
        method: "DELETE",
      });
      if (res.status !== 204) {
        throw new Error(body);
      }
    },

    async getVersion(): Promise<Version> {
      let [res, info] = await context.fetch(`/version`);
      if (res.status === 200) {
        return info as Version;
      }
      return { tag: "unknown", commit: "unknowm" };
    },
  };
  return context;
};

export const ApiContext = createContext(makeContext({} as ApiState, () => {}));

export const ApiProvider = ({ children }) => {
  const [state, setState] = useState<ApiState>({
    token: getStoredToken(),
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
