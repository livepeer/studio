import { ApiState, Version } from "../types";
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

export const getVersion = async (): Promise<Version> => {
  let [res, info] = await context.fetch(`/version`);
  if (res.status === 200) {
    return info as Version;
  }
  return { tag: "unknown", commit: "unknowm" };
};
