import qs from "qs";
import { ApiState, WebhookLogs } from "../types";
import { SetStateAction } from "react";
import { Webhook } from "@livepeer.studio/api";
import { getCursor } from "../helpers";
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

export const getWebhooks = async (
  allUsers: boolean,
  all: boolean,
  order?: string,
  filters?: Array<{ id: string; value: string | object }>,
  limit?: number,
  cursor?: string,
  count?: boolean
): Promise<[Webhook[], string, Response, number]> => {
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
      projectId,
    })}`
  );
  const nextCursor = getCursor(res.headers.get("link"));
  const c = res.headers.get("X-Total-Count");
  return [streams, nextCursor, res, c];
};

export const getWebhook = async (webhookId): Promise<Webhook> => {
  const url = `/webhook/${webhookId}?projectId=${projectId}`;
  const [res, webhook] = await context.fetch(url);
  if (res.status !== 200) {
    throw webhook && typeof webhook === "object"
      ? { ...webhook, status: res.status }
      : new Error(webhook);
  }
  return webhook;
};

export const createWebhook = async (params): Promise<Webhook> => {
  const url = `/webhook?projectId=${projectId}`;
  const [res, webhook] = await context.fetch(url, {
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
};

export const updateWebhook = async (id, params): Promise<Webhook> => {
  const url = `/webhook/${id}?projectId=${projectId}`;
  const [res, webhook] = await context.fetch(url, {
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
};

export const deleteWebhook = async (id: string): Promise<void> => {
  const url = `/webhook/${id}?projectId=${projectId}`;
  const [res, body] = await context.fetch(url, {
    method: "DELETE",
  });
  if (res.status !== 204) {
    throw new Error(body.errors.join(", "));
  }
};

export const deleteWebhooks = async (ids: Array<string>): Promise<void> => {
  const url = `/webhook?projectId=${projectId}`;
  const [res, body] = await context.fetch(url, {
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

export const getWebhookLogs = async (
  webhookId,
  filters = null
): Promise<WebhookLogs[]> => {
  const f = filters ? JSON.stringify(filters) : undefined;

  const [res, logs] = await context.fetch(
    `/webhook/${webhookId}/log?${qs.stringify({ filters: f, projectId })}`
  );
  if (res.status !== 200) {
    throw logs && typeof logs === "object"
      ? { ...logs, status: res.status }
      : new Error(logs);
  }
  return logs;
};

export const resendWebhook = async (params: {
  webhookId: string;
  logId: string;
}): Promise<WebhookLogs> => {
  const url = `/webhook/${params.webhookId}/log/${params.logId}/resend?projectId=${projectId}`;
  const [res, webhook] = await context.fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
  });

  if (res.status !== 200) {
    throw new Error(webhook.errors.join(", "));
  }
  return webhook;
};
