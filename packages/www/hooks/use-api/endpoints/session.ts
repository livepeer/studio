import qs from "qs";
import { Session, Stream } from "@livepeer.studio/api";
import { ApiState } from "../types";
import { getCursor } from "../helpers";
import { SetStateAction } from "react";

let context: any;
let setState: (value: SetStateAction<ApiState>) => void;

export const setSharedScope = (
  _context: any,
  _setState: (value: SetStateAction<ApiState>) => void,
) => {
  context = _context;
  setState = _setState;
};

export const getStreamSessions = async (
  id,
  cursor?: string,
  limit: number = 20,
  filters?: Array<{ id: string; value: string | object }>,
  count?: boolean,
): Promise<[Array<Stream>, string, number]> => {
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
};

export const getSession = async (
  id: string,
  cursor?: string,
  limit: number = 20,
  filters?: Array<{ id: string; value: string | object }>,
  count?: boolean,
): Promise<[Session, string, number]> => {
  const stringifiedFilters = filters ? JSON.stringify(filters) : undefined;
  const uri = `/session/${id}?${qs.stringify({
    limit,
    cursor,
    filters: stringifiedFilters,
    count,
  })}`;
  const [res, session] = await context.fetch(uri);
  if (res.status !== 200) {
    throw new Error(session);
  }
  const nextCursor = getCursor(res.headers.get("link"));
  const c = res.headers.get("X-Total-Count");
  return [session, nextCursor, c];
};

export const getStreamSessionsByUserId = async (
  userId,
  cursor?: string,
  limit: number = 20,
  order?: string,
  filters?: Array<{ id: string; value: string | object }>,
  count?: boolean,
): Promise<[Array<Stream>, string, number]> => {
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
};
