import AppPlayer from "@components/Site/AppPlayer";
import { Asset } from "livepeer";
import FailedProcessing from "./FailedProcessing";
import FileUploadingProgress from "./FileUploadingProgress";
import ProcessingProgress from "./ProcessingProgress";

const AssetStatusBox = ({ asset }: { asset?: Asset }) => {
  if (asset?.status?.phase === "ready" && asset.playbackUrl) {
    return <AppPlayer playbackUrl={asset.playbackUrl} autoPlay={false} />;
  }
  if (asset?.status?.phase === "failed") {
    return <FailedProcessing />;
  }
  if (asset?.status?.phase === "waiting") {
    return <FileUploadingProgress asset={asset} />;
  }
  return <ProcessingProgress asset={asset} />;
};

export default AssetStatusBox;
