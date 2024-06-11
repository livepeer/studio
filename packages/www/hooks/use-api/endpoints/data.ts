import { ApiState } from "../types";
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

export const getTotalViews = async (assetId: string): Promise<number> => {
  const [res, totalViews] = await context.fetch(`/data/views/${assetId}/total`);
  if (res.status !== 200) {
    throw totalViews && typeof totalViews === "object"
      ? { ...totalViews, status: res.status }
      : new Error(totalViews);
  }
  return totalViews[0].startViews;
};
