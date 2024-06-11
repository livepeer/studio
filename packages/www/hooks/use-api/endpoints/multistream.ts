import {
  MultistreamTarget,
  MultistreamTargetPatchPayload,
} from "@livepeer.studio/api";
import { HttpError } from "../../../lib/utils";
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

export const createMultistreamTarget = async (
  id: string,
  input: Omit<MultistreamTarget, "id">,
): Promise<MultistreamTarget> => {
  const [res, target] = await context.fetch("/multistream/target", {
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      "content-type": "application/json",
    },
  });
  if (res.status !== 201) {
    throw new HttpError(res.status, target);
  }
  return target;
};

export const getMultistreamTarget = async (
  id: string,
): Promise<MultistreamTarget> => {
  const uri = `/multistream/target/${id}`;
  const [res, target] = await context.fetch(uri);
  if (res.status !== 200) {
    throw new HttpError(res.status, target);
  }
  return target;
};

export const patchMultistreamTarget = async (
  id: string,
  patch: MultistreamTargetPatchPayload,
): Promise<void> => {
  const [res, body] = await context.fetch(`/multistream/target/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
    headers: {
      "content-type": "application/json",
    },
  });
  if (res.status !== 204) {
    throw new HttpError(res.status, body);
  }
};

export const deleteMultistreamTarget = async (id: string): Promise<void> => {
  const [res, body] = await context.fetch(`/multistream/target/${id}`, {
    method: "DELETE",
  });
  if (res.status !== 204) {
    throw new HttpError(res.status, body);
  }
};
