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

export const textToImage = async (params: any) => {
  const url = `/beta/generate/text-to-image`;
  const [res, image] = await context.fetch(url, {
    method: "POST",
    body: JSON.stringify(params),
    headers: {
      "content-type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(image.errors.join(", "));
  }

  return image;
};
