import { FileUpload } from "hooks/use-api";
import { Asset } from "@livepeer.studio/api";

export type FileUploadFilteredItem = {
  type: "file" | "asset";
  file?: FileUpload;
  asset?: Asset;
};

export const filteredItemsToShow = (
  fileUploads: FileUpload[],
  assets: Asset[]
): FileUploadFilteredItem[] => {
  const assetNamesUninque = new Set();
  const assetsFiltered = assets
    .filter((asset) => asset.status.phase === "failed")
    .filter((asset) => {
      // Filter outfailed assets that are currently not file uploads
      const fileUpload = fileUploads.find(
        (fileUpload) => fileUpload.file.name === asset.name
      );
      const doesAssetNameMatchesFile = fileUpload !== undefined;
      if (!doesAssetNameMatchesFile) return false;

      // Filter out assets creted earlier than the file upload
      const isAssetOld = asset.status.updatedAt < fileUpload.updatedAt;
      if (isAssetOld) return false;

      // Add this asset if it's the first one with this name (to filter out duplicates failed assets)
      const hasNameAlready = assetNamesUninque.has(asset.name);
      if (hasNameAlready) return false;
      assetNamesUninque.add(asset.name);
      return true;
    });

  const items = [
    ...assetsFiltered.map(
      (asset): FileUploadFilteredItem => ({ type: "asset", asset })
    ),
    ...fileUploads.map(
      (file): FileUploadFilteredItem => ({ type: "file", file })
    ),
  ];
  return items;
};
