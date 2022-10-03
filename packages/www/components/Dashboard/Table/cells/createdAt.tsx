import { Badge, Flex } from "@livepeer/design-system";
import { UploadIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
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

export type CreatedAtCellProps = {
  id: string;
  date: Date;
  fallback: React.ReactNode;
  href?: string;
  isStatusFailed: boolean;
  errorMessage?: string;
  isFileUploading: boolean;
  fileUploadProgress?: number;
};

const CreatedAtCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, CreatedAtCellProps>) => {
  const {
    id,
    date,
    fallback,
    isStatusFailed,
    errorMessage,
    isFileUploading,
    fileUploadProgress,
  } = cell.value;

  if (isStatusFailed) {
    return <FailedProcessing id={id} errorMessage={errorMessage} />;
  }
  if (isFileUploading) {
    return <FileUploading progress={fileUploadProgress} />;
  }
  return <CreatedAt date={date} fallback={fallback} />;
};

export default CreatedAtCell;
