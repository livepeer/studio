import { ApiState } from "../types";
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

export const getBroadcasters = async (): Promise<
  Array<{ address: string }>
> => {
  const [res, broadcasters] = await context.fetch(`/broadcaster`);
  if (res.status !== 200) {
    throw new Error(broadcasters);
  }
  return broadcasters;
};
