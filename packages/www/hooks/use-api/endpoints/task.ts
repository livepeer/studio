import qs from "qs";
import { ApiState } from "../types";
import { SetStateAction } from "react";
import { getCursor } from "../helpers";
import { Task } from "@livepeer.studio/api";

let context: any;
let setState: (value: SetStateAction<ApiState>) => void;

export const setSharedScope = (
  _context: any,
  _setState: (value: SetStateAction<ApiState>) => void
) => {
  context = _context;
  setState = _setState;
};

export const getTasks = async (
  userId,
  opts?: {
    filters?: Array<{ id: string; value: string | object }>;
    limit?: number | string;
    cursor?: string;
    order?: string;
    active?: boolean;
    count?: boolean;
  }
): Promise<[Array<Task>, string, number]> => {
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
};
