import { Badge } from "@livepeer/design-system";
import { format } from "date-fns";
import ReactTooltip from "react-tooltip";
import { CellComponentProps, TableData } from "../types";

export type DateCellProps = {
  id: string;
  date: Date;
  fallback: React.ReactNode;
  isStatusFailed: boolean;
  errorMessage?: string;
};

const DateCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, DateCellProps>) => {
  const { id, date, fallback, isStatusFailed, errorMessage } = cell.value;

  if (isStatusFailed) {
    const tooltipId = `tooltip-error-${id}`;
    return (
      <>
        {errorMessage !== undefined && (
          <ReactTooltip
            id={tooltipId}
            className="tooltip"
            place="top"
            type="dark"
            effect="solid">
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
  }

  try {
    return format(date, "MMMM dd, yyyy h:mm a");
  } catch (error) {
    return fallback;
  }
};

export default DateCell;
