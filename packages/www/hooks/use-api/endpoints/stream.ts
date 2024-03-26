import qs from "qs";
import {
  Error as ApiError,
  Stream,
  StreamPatchPayload,
} from "@livepeer.studio/api";
import { HttpError } from "../../../lib/utils";
import { ApiState, StreamInfo } from "../types";
import { getCursor } from "../helpers";
import { SetStateAction } from "react";

let context: any;
let setState: (value: SetStateAction<ApiState>) => void;

export const setSharedScope = (
  _context: any,
  _setState: (value: SetStateAction<ApiState>) => void
) => {
  context = _context;
  setState = _setState;
};

export const getStreamInfo = async (
  id: string
): Promise<[Response, StreamInfo | ApiError]> => {
  let [res, info] = await context.fetch(`/stream/${id}/info`);
  return [res, info as StreamInfo | ApiError];
};

export const getStream = async (streamId): Promise<Stream> => {
  const [res, stream] = await context.fetch(`/stream/${streamId}`);
  if (res.status !== 200) {
    throw stream && typeof stream === "object"
      ? { ...stream, status: res.status }
      : new Error(stream);
  }
  return stream;
};

export const getStreams = async (
  userId: string,
  opts?: {
    filters?: Array<{ id: string; value: string | object }>;
    limit?: number | string;
    cursor?: string;
    order?: string;
    active?: boolean;
    count?: boolean;
  }
): Promise<[Stream[], string, number, number, number, number]> => {
  const filters = opts?.filters ? JSON.stringify(opts?.filters) : undefined;
  console.log("filters", opts?.filters);
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

  const [allStreamRes] = await context.fetch(
    `/stream?${qs.stringify({
      userId,
      filters,
      active: undefined,
      limit: opts?.limit,
      count: true,
      streamsonly: 1,
    })}`
  );
  const [activeStreamRes] = await context.fetch(
    `/stream?${qs.stringify({
      userId,
      filters,
      active: true,
      limit: opts?.limit,
      count: true,
      streamsonly: 1,
    })}`
  );

  const [unHealtyStreamRes] = await context.fetch(
    `/stream?${qs.stringify({
      userId,
      filters,
      active: true,
      isHealthy: false,
      limit: opts?.limit,
      count: true,
      streamsonly: 1,
    })}`
  );

  if (res.status !== 200) {
    throw new Error(streams);
  }
  const nextCursor = getCursor(res.headers.get("link"));
  const count = res.headers.get("X-Total-Count");
  const allStreamCount = allStreamRes.headers.get("X-Total-Count");
  const activeStreamCount = activeStreamRes.headers.get("X-Total-Count");
  const unHealtyStreamCount = unHealtyStreamRes.headers.get("X-Total-Count");
  return [
    streams,
    nextCursor,
    count,
    allStreamCount,
    activeStreamCount,
    unHealtyStreamCount,
  ];
};

export const getAdminStreams = async ({
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
}): Promise<[Array<Stream> | ApiError, string, Response]> => {
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
};

export const generateJwt = async (playbackId: string): Promise<string> => {
  const [res] = await context.fetch(
    `/access-control/signing-key/jwt/${playbackId}`
  );
  if (res.status !== 200) {
    throw new Error(JSON.stringify(res.body));
  }

  // Get json and get jsonRes.token
  let resJson = await res.json();
  let token = resJson.token;

  return token;
};

export const createStream = async (params): Promise<Stream> => {
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
};

export const terminateStream = async (id: string): Promise<boolean> => {
  const [res, body] = await context.fetch(`/stream/${id}/terminate`, {
    method: "DELETE",
  });
  if (!res.ok) {
    if (body && body.errors) {
      throw new Error(body.errors);
    }
    throw new Error(body);
  }
  return true;
};

export const deleteStream = async (id: string): Promise<void> => {
  const [res, body] = await context.fetch(`/stream/${id}`, {
    method: "DELETE",
  });
  if (res.status !== 204) {
    throw new Error(body);
  }
};

export const deleteStreams = async (ids: Array<string>): Promise<void> => {
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
};

export const patchStream = async (
  streamId: string,
  patch: StreamPatchPayload
): Promise<void> => {
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
};
