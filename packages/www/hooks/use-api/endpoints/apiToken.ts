import qs from "qs";
import { ApiState } from "../types";
import { SetStateAction } from "react";
import { ApiToken, Error as ApiError } from "@livepeer.studio/api";
import { getCursor } from "../helpers";
import { trackPageView } from "../tracking";
import { projectId } from "hooks/use-project";

let context: any;
let setState: (value: SetStateAction<ApiState>) => void;

export const setSharedScope = (
  _context: any,
  _setState: (value: SetStateAction<ApiState>) => void
) => {
  context = _context;
  setState = _setState;
};

export const getApiTokens = async (
  userId?: string,
  opts?: {
    filters?: Array<{ id: string; value: string | object }>;
    limit?: number;
    cursor?: string;
    order?: string;
    count?: boolean;
  }
): Promise<[Array<ApiToken> | ApiError, string, Response, number]> => {
  const filters = opts?.filters ? JSON.stringify(opts?.filters) : undefined;
  const [res, tokens] = await context.fetch(
    `/api-token?${qs.stringify({
      userId,
      filters,
      order: opts?.order,
      limit: opts?.limit,
      cursor: opts?.cursor,
      count: opts?.count,
      projectId: projectId,
    })}`
  );
  const nextCursor = getCursor(res.headers.get("link"));
  const count = res.headers.get("X-Total-Count");
  return [tokens, nextCursor, res, count];
};

export const createApiToken = async (params): Promise<ApiToken> => {
  trackPageView(params.email, "/create-api-token");
  const [res, token] = await context.fetch(
    `/api-token?projectId=${projectId}`,
    {
      method: "POST",
      body: JSON.stringify(params),
      headers: {
        "content-type": "application/json",
      },
    }
  );
  if (res.status !== 201) {
    throw new Error(JSON.stringify(res.errors));
  }
  return token;
};

export const deleteApiToken = async (id: string): Promise<void> => {
  const [res, body] = await context.fetch(`/api-token/${id}`, {
    method: "DELETE",
  });
  if (res.status !== 204) {
    throw new Error(body);
  }
};
