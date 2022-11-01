import qs from "qs";
import {
  Error as ApiError,
  MultistreamTarget,
  MultistreamTargetPatchPayload,
  Stream,
  StreamPatchPayload,
} from "@livepeer.studio/api";
import { HttpError } from "../../../lib/utils";
import { StreamInfo } from "../types";
import { ApiContextInterface } from "..";
import { getCursor } from "../helpers";

const makeStreamEndpointFunctions = (context: ApiContextInterface) => ({
  async getStreamInfo(id: string): Promise<[Response, StreamInfo | ApiError]> {
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
});

export default makeStreamEndpointFunctions;
