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

export const upscale = async (formData: any) => {
  const url = `/beta/generate/upscale`;
  const [res, image] = await context.fetch(url, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    throw new Error(image.errors.join(", "));
  }

  return image;
};

export const imageToVideo = async (formData: any) => {
  const url = `/beta/generate/image-to-video`;
  const [res, video] = await context.fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(video.errors.join(", "));
  }

  return video;
};

export const imageToImage = async (formData: any) => {
  const url = `/beta/generate/image-to-image`;
  const [res, image] = await context.fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(image.errors.join(", "));
  }

  return image;
};

export const audioToText = async (formData: any) => {
  const url = `/beta/generate/audio-to-text`;
  const [res, text] = await context.fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(text.errors.join(", "));
  }

  return [text];
};

export const segmentImage = async (formData: any) => {
  const url = `/beta/generate/segment-anything-2`;
  const [res, image] = await context.fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(image.errors.join(", "));
  }

  return image;
};
