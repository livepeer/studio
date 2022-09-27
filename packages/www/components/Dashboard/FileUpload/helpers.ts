import { FileUpload } from "hooks/use-api";
import { Asset } from "livepeer";

export type FileUploadFilteredItem = {
  type: "file" | "asset";
  file?: FileUpload;
  asset?: Asset;
}

export const filteredItemsToShow = (fileUploads: FileUpload[], assets: Asset[]): FileUploadFilteredItem[] => {
  const fileNames = fileUploads.map(
    (file) => file.file.name
  );

  const assetNamesUninque = new Set()
  const assetsFiltered = assets
    .filter((asset) => asset.status.phase === "failed")
    .filter((asset) => {
      // Filter failed assets that are currently not file uploads
      const doesAssetNameMatchesFile = fileNames.indexOf(asset.name) !== -1;
      if (!doesAssetNameMatchesFile) return false;
      // Add this asset if it's the first one with this name (to filter out duplicates failed assets)
      const hasNameAlready = assetNamesUninque.has(asset.name);
      if (hasNameAlready) return false;
      assetNamesUninque.add(asset.name);
      return true;
    });

  const items = [
    ...assetsFiltered.map((asset): FileUploadFilteredItem => ({ type: "asset", asset })),
    ...fileUploads.map((file): FileUploadFilteredItem => ({ type: "file", file })),
  ];
  return items;
}
