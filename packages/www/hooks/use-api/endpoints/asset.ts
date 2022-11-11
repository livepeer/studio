import { ApiState, FileUpload } from "../types";
import { SetStateAction } from "react";
import { Asset, AssetPatchPayload } from "@livepeer.studio/api";
import { HttpError } from "../../../lib/utils";
import * as tus from "tus-js-client";
import qs from "qs";
import { getCursor } from "../helpers";

let context: any;
let setState: (value: SetStateAction<ApiState>) => void;

export const setSharedScope = (
  _context: any,
  _setState: (value: SetStateAction<ApiState>) => void
) => {
  context = _context;
  setState = _setState;
};

export const createAsset = async (params): Promise<Asset> => {
  const [res, asset] = await context.fetch(`/asset/import`, {
    method: "POST",
    body: JSON.stringify(params),
    headers: {
      "content-type": "application/json",
    },
  });

  if (res.status !== 201) {
    throw new Error(asset.errors.join(", "));
  }
  return asset;
};

export const uploadAssets = async (
  files: File[],
  onSuccess?: (file: File) => void,
  onError?: (file: File, error: Error) => void,
  onProgress?: (file: File, progress: number) => void
): Promise<void> => {
  const requestAssetUpload = async (
    params
  ): Promise<{ tusEndpoint: string }> => {
    const [res, assetUpload] = await context.fetch(`/asset/request-upload`, {
      method: "POST",
      body: JSON.stringify(params),
      headers: {
        "content-type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(assetUpload.errors.join(", "));
    }
    return assetUpload;
  };

  const updateStateWithProgressOrError = (
    file: File,
    progress: number,
    completed: boolean,
    updatedAt: number,
    error?: Error
  ) => {
    setState((state) => ({
      ...state,
      currentFileUploads: {
        ...state.currentFileUploads,
        [file.name]: {
          file,
          progress,
          error,
          updatedAt,
          completed:
            state?.currentFileUploads?.[file.name]?.completed ||
            Boolean(completed),
        },
      },
    }));
  };

  const getTusUpload = (file: File, tusEndpoint?: string) =>
    new tus.Upload(file, {
      endpoint: tusEndpoint ?? undefined, // URL from `tusEndpoint` field in the `/request-upload` response
      metadata: {
        filetype: file.type,
      },
      uploadSize: file.size,
      onError(err) {
        updateStateWithProgressOrError(file, 0, false, Date.now(), err);
        if (onError) onError(file, err);
      },
      onProgress(bytesUploaded, bytesTotal) {
        const percentage = bytesUploaded / bytesTotal;
        updateStateWithProgressOrError(file, percentage, false, Date.now());
        if (onProgress) onProgress(file, percentage);
      },
      onSuccess() {
        updateStateWithProgressOrError(file, 1, true, Date.now());
        if (onSuccess) onSuccess(file);
      },
    });

  for (const file of files) {
    try {
      updateStateWithProgressOrError(file, 0, false, Date.now());

      const uploadWithoutUrl = getTusUpload(file);
      const previousUploads = await uploadWithoutUrl.findPreviousUploads();
      if (previousUploads.length > 0) {
        uploadWithoutUrl.resumeFromPreviousUpload(previousUploads[0]);
        uploadWithoutUrl.start();
      } else {
        const assetUpload = await requestAssetUpload({ name: file.name });
        const upload = getTusUpload(file, assetUpload.tusEndpoint);
        upload.start();
      }
    } catch (e) {
      updateStateWithProgressOrError(file, 0, false, Date.now(), e);
    }
  }
};

export const getFilteredFileUploads = (): FileUpload[] => {
  return Object.keys(context.currentFileUploads ?? {})
    .map((key) => context.currentFileUploads?.[key])
    .filter((file) => file && !file.error && file.file.name);
};

export const clearFileUploads = async () => {
  setState((state) => ({ ...state, currentFileUploads: {} }));
};

export const getAssets = async (
  userId: string,
  opts?: {
    filters?: Array<{ id: string; value: string | object }>;
    limit?: number | string;
    cursor?: string;
    order?: string;
    active?: boolean;
    count?: boolean;
  }
): Promise<[Asset[], string, number]> => {
  const filters = opts?.filters ? JSON.stringify(opts?.filters) : undefined;
  const [res, assets] = await context.fetch(
    `/asset?${qs.stringify({
      userId,
      filters,
      active: opts?.active,
      order: opts?.order,
      limit: opts?.limit,
      cursor: opts?.cursor,
      count: opts?.count,
      streamsonly: 1,
    })}`
  );
  if (res.status !== 200) {
    throw new Error(assets);
  }
  setState((state) => ({ ...state, latestGetAssetsResult: assets }));
  const nextCursor = getCursor(res.headers.get("link"));
  const count = res.headers.get("X-Total-Count");
  return [assets, nextCursor, count];
};

export const getAsset = async (assetId): Promise<Asset> => {
  const [res, asset] = await context.fetch(`/asset/${assetId}`);
  if (res.status !== 200) {
    throw asset && typeof asset === "object"
      ? { ...asset, status: res.status }
      : new Error(asset);
  }
  return asset;
};

export const patchAsset = async (
  assetId: string,
  patch: AssetPatchPayload
): Promise<void> => {
  const [res, body] = await context.fetch(`/asset/${assetId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
    headers: {
      "content-type": "application/json",
    },
  });
  if (res.status !== 200) {
    throw new HttpError(res.status, body);
  }
  return res;
};

export const deleteAsset = async (assetId): Promise<void> => {
  const [res] = await context.fetch(`/asset/${assetId}`, {
    method: "DELETE",
  });
  if (res.status !== 204) {
    throw new Error(`Failed to delete asset with id: ${assetId}`);
  }
};
