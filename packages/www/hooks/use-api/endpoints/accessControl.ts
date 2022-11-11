import qs from "qs";
import { ApiState } from "../types";
import { SetStateAction } from "react";
import {
  Error as ApiError,
  SigningKey,
  SigningKeyResponsePayload,
} from "@livepeer.studio/api";
import { getCursor } from "../helpers";
import { trackPageView } from "../tracking";

let context: any;
let setState: (value: SetStateAction<ApiState>) => void;

export const setSharedScope = (
  _context: any,
  _setState: (value: SetStateAction<ApiState>) => void
) => {
  context = _context;
  setState = _setState;
};

export const getSigningKeys = async (opts?: {
  filters?: Array<{ id: string; value: string | object }>;
  limit?: number;
  cursor?: string;
  order?: string;
  count?: boolean;
}): Promise<[Array<SigningKey> | ApiError, string, Response, number]> => {
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
};

export const createSigningKey = async (
  params
): Promise<SigningKeyResponsePayload> => {
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
};

export const deleteSigningKey = async (id: string): Promise<void> => {
  const [res, body] = await context.fetch(`/access-control/signing-key/${id}`, {
    method: "DELETE",
  });
  if (res.status !== 204) {
    throw new Error(body);
  }
};
