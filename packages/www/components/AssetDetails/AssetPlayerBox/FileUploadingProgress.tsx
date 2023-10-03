import { useEffect, useState } from "react";
import useApi from "hooks/use-api";
import { fileUploadProgressForAsset } from "components/AssetsTable/helpers";
import { Asset } from "@livepeer.studio/api";
import Progress from "./Progress";

const FileUploadingProgress = ({ asset }: { asset?: Asset }) => {
  const { getFilteredFileUploads } = useApi();
  const [fileUploadProgress, setFileUploadProgress] = useState<
    number | undefined
  >();
  const percentage =
    fileUploadProgress !== undefined
      ? Math.floor(fileUploadProgress * 100)
      : undefined;

  useEffect(() => {
    const fileUploads = getFilteredFileUploads();
    const newProgress = fileUploadProgressForAsset(asset, fileUploads);
    if (JSON.stringify(newProgress) !== JSON.stringify(fileUploadProgress)) {
      setFileUploadProgress(newProgress);
    }
  });

  return <Progress text="Uploading" percentage={percentage} />;
};

export default FileUploadingProgress;
