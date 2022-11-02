import { ApiState, Ingest } from "../types";
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

export const getIngest = async (all = false): Promise<Array<Ingest>> => {
  const q = all ? "?first=false" : "";
  const [res, ingest] = await context.fetch(`/ingest${q}`);
  if (res.status !== 200) {
    throw new Error(ingest);
  }
  return ingest;
};
