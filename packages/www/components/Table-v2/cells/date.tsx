import { format } from "date-fns";
import { CellComponentProps, TableData } from "../types";

export type DateCellProps = { date: Date; fallback: React.ReactNode };

const DateCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, DateCellProps>) => {
  try {
    return format(cell.value.date, "MMMM dd, yyyy h:mm a");
  } catch (error) {
    return cell.value.fallback;
  }
};

export default DateCell;
