import { Session } from "@livepeer.studio/api";
import { formatDuration, intervalToDuration } from "date-fns";
import { CellComponentProps, TableData } from "../types";

export type DurationCellProps = {
  sourceSegmentsDuration: number;
  status?: Session["recordingStatus"];
};

const DurationCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, DurationCellProps>) => {
  switch (cell.value.status) {
    case "waiting":
      return "In progress";
    case "failed":
      return "Failed";
    case "deleted":
      return "Deleted";
  }
  if (
    cell.value.sourceSegmentsDuration === 0 ||
    cell.value.status !== "ready"
  ) {
    return "n/a";
  }

  try {
    const durationMins = Math.round(cell.value.sourceSegmentsDuration / 60);
    if (!durationMins) {
      return "Less than 1 minute";
    }
    const dur = intervalToDuration({
      start: new Date(0),
      end: new Date(durationMins * 60 * 1000 || 0),
    });
    return formatDuration(dur);
  } catch (error) {
    return "—";
  }
};

export default DurationCell;
