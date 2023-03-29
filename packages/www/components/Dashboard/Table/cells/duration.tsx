import { formatDuration, intervalToDuration } from "date-fns";
import { CellComponentProps, TableData } from "../types";

export type DurationCellProps = {
  sourceSegmentsDuration: number;
  status?: string;
};

const DurationCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, DurationCellProps>) => {
  if (cell.value.status === "waiting") {
    return "In progress";
  }
  if (cell.value.sourceSegmentsDuration === 0) {
    return "n/a";
  }
  try {
    const durationMins = Math.round(cell.value.sourceSegmentsDuration / 60);
    if (!durationMins) {
      return "<1 minute";
    }
    const dur = intervalToDuration({
      start: new Date(0),
      end: new Date(durationMins * 60 * 1000 || 0),
    });
    return formatDuration(dur);
  } catch (error) {
    return "n/a";
  }
};

export default DurationCell;
