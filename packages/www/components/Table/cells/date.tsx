import { format } from "date-fns";
import { CellComponentProps, TableData } from "../types";

export type DateCellProps = {
  date: Date;
  fallback: React.ReactNode;
  href?: string;
};

const DateCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, DateCellProps>) => {
  const { date, fallback } = cell.value;
  try {
    return format(date, "MMMM dd, yyyy h:mm a");
  } catch (error) {
    return fallback;
  }
};

export default DateCell;
