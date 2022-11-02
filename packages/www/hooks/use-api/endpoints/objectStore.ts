import qs from "qs";
import { ApiState } from "../types";
import { SetStateAction } from "react";
import { ObjectStore, Webhook, Error as ApiError } from "@livepeer.studio/api";
import { getCursor } from "../helpers";

let context: any;
let setState: (value: SetStateAction<ApiState>) => void;

export const setSharedScope = (
  _context: any,
  _setState: (value: SetStateAction<ApiState>) => void
) => {
  context = _context;
  setState = _setState;
};

export const getObjectStore = async (
  userId?: string,
  order?: string,
  filters?: Array<{ id: string; value: string }>,
  limit?: number,
  cursor?: string
): Promise<[Array<Webhook> | ApiError, string, Response]> => {
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
};

export const createObjectStore = async (params): Promise<ObjectStore> => {
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
};

export const disableObjectStore = async (
  id: string,
  disabled: boolean
): Promise<[Response, boolean | ApiError]> => {
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
};
