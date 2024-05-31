/** @jsxImportSource @emotion/react */
import { Session } from "@livepeer.studio/api";
import { formatDuration, intervalToDuration } from "date-fns";
import { CellComponentProps, TableData } from "../types";

export type DurationCellProps = {
  duration: number;
  status?: Session["recordingStatus"];
};

const DurationCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, DurationCellProps>) => {
  if (cell.value.status === "waiting") {
    return "In progress";
  } else if (cell.value.status === "failed") {
    return "Failed";
  }
  if (cell.value.duration === 0 || cell.value.status !== "ready") {
    return "n/a";
  }
  try {
    const dur = intervalToDuration({
      start: new Date(0),
      end: new Date(Math.ceil(cell.value.duration / 60) * 60 * 1000 || 0),
    });
    return formatDuration(dur);
  } catch (error) {
    return "n/a";
  }
};

export default DurationCell;
