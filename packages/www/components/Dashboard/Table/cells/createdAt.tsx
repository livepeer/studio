import { Asset } from "@livepeer.studio/api";
import { Badge, Flex } from "@livepeer/design-system";
import { UploadIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { useApi } from "hooks";
import { FileUpload, FileUploadsDictionary } from "hooks/use-api";
import { useEffect, useMemo, useState } from "react";
import ReactTooltip from "react-tooltip";
import { CellComponentProps, TableData } from "../types";

const CreatedAt = ({ date, fallback }) => {
  try {
    return format(date, "MMMM dd, yyyy h:mm a");
  } catch (error) {
    return fallback;
  }
};

const FailedProcessing = ({ id, errorMessage }) => {
  const tooltipId = `tooltip-error-${id}`;
  return (
    <>
      {errorMessage !== undefined && (
        <ReactTooltip
          id={tooltipId}
          className="tooltip"
          place="top"
          type="dark"
          effect="solid"
          delayShow={500}>
          {errorMessage}
        </ReactTooltip>
      )}
      <Badge
        data-tip
        data-for={tooltipId}
        size="1"
        variant="red"
        css={{ padding: "0 $2" }}>
        Internal error processing file
      </Badge>
    </>
  );
};

const FileUploading = ({ progress }) => (
  <Flex gap={1}>
    <UploadIcon /> Uploading {Math.floor(progress * 100)}%
  </Flex>
);

const ProcessingProgress = ({ progress }) => (
  <Flex gap={1}>
    <UploadIcon /> Processing {Math.floor(progress * 100)}%
  </Flex>
);

const fileUploadProgressForAsset = (
  asset: Asset,
  fileUploads: FileUpload[]
): number | undefined => {
  const fileUpload = fileUploads.find(
    (upload) => upload.file.name === asset.name
  );
  return fileUpload && asset.status?.phase === "waiting"
    ? fileUpload.progress
    : undefined;
};

export type CreatedAtCellProps = {
  id: string;
  date: Date;
  fallback: React.ReactNode;
  href?: string;
  asset: Asset;
};

const CreatedAtCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, CreatedAtCellProps>) => {
  const { id, date, fallback, asset } = cell.value;

  const { getCurrentFileUploadsArray } = useApi();
  const [currentFileUploads, setCurrentFileUploads] = useState<FileUpload[]>(
    []
  );

  const fileUploadProgress = useMemo(() => {
    const fileUploadsFiltered = currentFileUploads.filter(
      (file) => file && !file.error && file.file.name
    );
    return fileUploadProgressForAsset(asset, fileUploadsFiltered);
  }, [currentFileUploads]);

  const isFileUploading =
    fileUploadProgress !== undefined && fileUploadProgress !== 1;

  useEffect(() => {
    // Has to fetch the file uploads from this cell, instead of from the table fetcher, to avoid fetching again assets too
    const fileUploads = getCurrentFileUploadsArray();
    if (JSON.stringify(fileUploads) !== JSON.stringify(currentFileUploads)) {
      setCurrentFileUploads(fileUploads);
    }
  });

  const { phase, errorMessage, progress } = asset.status;

  if (phase === "failed") {
    return <FailedProcessing id={id} errorMessage={errorMessage} />;
  }
  if (phase === "processing") {
    return <ProcessingProgress progress={progress} />;
  }
  if (isFileUploading) {
    return <FileUploading progress={fileUploadProgress} />;
  }
  return <CreatedAt date={date} fallback={fallback} />;
};

export default CreatedAtCell;
