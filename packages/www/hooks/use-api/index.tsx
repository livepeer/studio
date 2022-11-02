import { useState, useContext, createContext, useEffect } from "react";
import jwt from "jsonwebtoken";
import {
  User,
  Error as ApiError,
  ApiToken,
  Webhook,
  ObjectStore,
  AssetPatchPayload,
  Asset,
  Task,
  SigningKey,
  SigningKeyResponsePayload,
} from "@livepeer.studio/api";
import qs from "qs";
import { isStaging, isDevelopment, HttpError } from "../../lib/utils";
import * as tus from "tus-js-client";
import { ApiState, Ingest, FileUpload, Version } from "./types";
import { clearToken, getStoredToken } from "./tokenStorage";
import { trackPageView } from "./tracking";
import makeStreamEndpointsFunctions from "./endpoints/stream";
import makeUserEndpointsFunctions from "./endpoints/user";
import { getCursor } from "./helpers";

/**
 * Primary React API client. Definitely a "first pass". Should be replaced with some
 * helpers around a nice auto-generated TypeScript client from our Swagger schema.
 */

const makeContext = (
  state: ApiState,
  setState: React.Dispatch<React.SetStateAction<ApiState>>
) => {
  const endpoint = isDevelopment()
    ? `http://localhost:3004`
    : isStaging()
    ? `https://livepeer.monster`
    : ``;

  const context = {
    ...state,
    endpoint,

    async fetch(url: string, opts: RequestInit = {}) {
      let headers = new Headers(opts.headers || {});
      if (state.token && !headers.has("authorization")) {
        headers.set("authorization", `JWT ${state.token}`);
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
      return [res, body];
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

    async uploadAssets(
      files: File[],
      onSuccess?: (file: File) => void,
      onError?: (file: File, error: Error) => void,
      onProgress?: (file: File, progress: number) => void
    ): Promise<void> {
      const requestAssetUpload = async (
        params
      ): Promise<{ tusEndpoint: string }> => {
        const [res, assetUpload] = await context.fetch(
          `/asset/request-upload`,
          {
            method: "POST",
            body: JSON.stringify(params),
            headers: {
              "content-type": "application/json",
            },
          }
        );

        if (!res.ok) {
          throw new Error(assetUpload.errors.join(", "));
        }
        return assetUpload;
      };

      const updateStateWithProgressOrError = (
        file: File,
        progress: number,
        completed: boolean,
        updatedAt: number,
        error?: Error
      ) => {
        setState((state) => ({
          ...state,
          currentFileUploads: {
            ...state.currentFileUploads,
            [file.name]: {
              file,
              progress,
              error,
              updatedAt,
              completed:
                state?.currentFileUploads?.[file.name]?.completed ||
                Boolean(completed),
            },
          },
        }));
      };

      const getTusUpload = (file: File, tusEndpoint?: string) =>
        new tus.Upload(file, {
          endpoint: tusEndpoint ?? undefined, // URL from `tusEndpoint` field in the `/request-upload` response
          metadata: {
            filetype: file.type,
          },
          uploadSize: file.size,
          onError(err) {
            updateStateWithProgressOrError(file, 0, false, Date.now(), err);
            if (onError) onError(file, err);
          },
          onProgress(bytesUploaded, bytesTotal) {
            const percentage = bytesUploaded / bytesTotal;
            updateStateWithProgressOrError(file, percentage, false, Date.now());
            if (onProgress) onProgress(file, percentage);
          },
          onSuccess() {
            updateStateWithProgressOrError(file, 1, true, Date.now());
            if (onSuccess) onSuccess(file);
          },
        });

      for (const file of files) {
        try {
          updateStateWithProgressOrError(file, 0, false, Date.now());

          const uploadWithoutUrl = getTusUpload(file);
          const previousUploads = await uploadWithoutUrl.findPreviousUploads();
          if (previousUploads.length > 0) {
            uploadWithoutUrl.resumeFromPreviousUpload(previousUploads[0]);
            uploadWithoutUrl.start();
          } else {
            const assetUpload = await requestAssetUpload({ name: file.name });
            const upload = getTusUpload(file, assetUpload.tusEndpoint);
            upload.start();
          }
        } catch (e) {
          updateStateWithProgressOrError(file, 0, false, Date.now(), e);
        }
      }
    },

    getFilteredFileUploads(): FileUpload[] {
      return Object.keys(state.currentFileUploads ?? {})
        .map((key) => state.currentFileUploads?.[key])
        .filter((file) => file && !file.error && file.file.name);
    },

    async clearFileUploads() {
      setState((state) => ({ ...state, currentFileUploads: {} }));
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
      setState((state) => ({ ...state, latestGetAssetsResult: assets }));
      const nextCursor = getCursor(res.headers.get("link"));
      const count = res.headers.get("X-Total-Count");
      return [assets, nextCursor, count];
    },

    async getAsset(assetId): Promise<Asset> {
      const [res, asset] = await context.fetch(`/asset/${assetId}`);
      if (res.status !== 200) {
        throw asset && typeof asset === "object"
          ? { ...asset, status: res.status }
          : new Error(asset);
      }
      return asset;
    },

    async patchAsset(assetId: string, patch: AssetPatchPayload): Promise<void> {
      const [res, body] = await context.fetch(`/asset/${assetId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
        headers: {
          "content-type": "application/json",
        },
      });
      if (res.status !== 200) {
        throw new HttpError(res.status, body);
      }
      return res;
    },

    async deleteAsset(assetId): Promise<void> {
      const [res] = await context.fetch(`/asset/${assetId}`, {
        method: "DELETE",
      });
      if (res.status !== 204) {
        throw new Error(`Failed to delete asset with id: ${assetId}`);
      }
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

    async getSigningKeys(opts?: {
      filters?: Array<{ id: string; value: string | object }>;
      limit?: number;
      cursor?: string;
      order?: string;
      count?: boolean;
    }): Promise<[Array<SigningKey> | ApiError, string, Response, number]> {
      const filters = opts?.filters ? JSON.stringify(opts?.filters) : undefined;
      const [res, signingKeys] = await context.fetch(
        `/access-control/signing-key?${qs.stringify({
          filters,
          order: opts?.order,
          limit: opts?.limit,
          cursor: opts?.cursor,
          count: opts?.count,
        })}`
      );
      const nextCursor = getCursor(res.headers.get("link"));
      const count = res.headers.get("X-Total-Count");
      return [signingKeys, nextCursor, res, count];
    },

    async createSigningKey(params): Promise<SigningKeyResponsePayload> {
      trackPageView(params.email, "/create-signing-key");
      const [res, token] = await context.fetch(`/access-control/signing-key`, {
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

    async deleteSigningKey(id: string): Promise<void> {
      const [res, body] = await context.fetch(
        `/access-control/signing-key/${id}`,
        {
          method: "DELETE",
        }
      );
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

    async getTotalViews(assetId: string): Promise<number> {
      const [res, totalViews] = await context.fetch(
        `/data/views/${assetId}/total`
      );
      if (res.status !== 200) {
        throw totalViews && typeof totalViews === "object"
          ? { ...totalViews, status: res.status }
          : new Error(totalViews);
      }
      return totalViews[0].startViews;
    },
  };

  return {
    ...context,
    ...makeUserEndpointsFunctions(context, state, setState),
    ...makeStreamEndpointsFunctions(context),
  };
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
