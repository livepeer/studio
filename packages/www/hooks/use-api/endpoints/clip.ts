import qs from "qs";
import { Stream, Asset } from "@livepeer.studio/api";
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

export const getClipsBySessionId = async (
  sessionId: string,
  cursor?: string,
  limit: number = 20,
  order?: string,
  filters?: Array<{ id: string; value: string | object }>,
  count?: boolean,
): Promise<[Array<Asset>, string, number]> => {
  const stringifiedFilters = filters ? JSON.stringify(filters) : undefined;
  const uri = `/clip/${sessionId}?${qs.stringify({
    limit,
    cursor,
    order,
    filters: stringifiedFilters,
    count,
  })}`;
  const [res, clips] = await context.fetch(uri);
  if (res.status !== 200) {
    throw new Error(clips);
  }
  const nextCursor = getCursor(res.headers.get("link"));
  const c = res.headers.get("X-Total-Count");
  return [clips, nextCursor, c];
};
