import { fileUploadProgressForAsset } from "components/AssetsTable/helpers";
import { Asset } from "livepeer";
import { Badge, Box, Flex, Tooltip } from "@livepeer/design-system";
import { UploadIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { useApi } from "hooks";
import { useEffect, useState } from "react";
import ReactTooltip from "react-tooltip";
import { CellComponentProps, TableData } from "../types";
import { QuestionMarkCircledIcon as Help } from "@radix-ui/react-icons";

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

const ProcessingProgress = ({ progress, playbackUrl }) => (
  <Flex gap={1}>
    <UploadIcon /> Processing {Math.floor(progress * 100)}%
    {playbackUrl && (
      <Tooltip
        multiline
        content="Your video can now be played. In the background, it is converted into several quality levels so that it can be played smoothly by all viewers.">
        <Help />
      </Tooltip>
    )}
  </Flex>
);

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
  const { getFilteredFileUploads } = useApi();
  const [fileUploadProgress, setFileUploadProgress] = useState<
    number | undefined
  >();
  const { id, date, fallback, asset } = cell.value;
  const { phase, errorMessage, progress } = asset.status;
  const isFileUploading = fileUploadProgress !== undefined;
  const playbackUrl = asset.playbackUrl;

  useEffect(() => {
    // Has to fetch the file uploads from this cell, instead of from the table fetcher, to avoid fetching again assets too
    const fileUploads = getFilteredFileUploads();
    const newProgress = fileUploadProgressForAsset(asset, fileUploads);
    if (JSON.stringify(newProgress) !== JSON.stringify(fileUploadProgress)) {
      setFileUploadProgress(newProgress);
    }
  });

  if (phase === "failed") {
    return <FailedProcessing id={id} errorMessage={errorMessage} />;
  }
  if (phase === "processing") {
    return <ProcessingProgress progress={progress} playbackUrl={playbackUrl} />;
  }
  if (isFileUploading) {
    return <FileUploading progress={fileUploadProgress} />;
  }
  return <CreatedAt date={date} fallback={fallback} />;
};

export default CreatedAtCell;
