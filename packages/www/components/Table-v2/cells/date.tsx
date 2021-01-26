import { format } from "date-fns";
import { CellComponentProps, TableData } from "../types";

const DateCell = <D extends TableData>({ cell }: CellComponentProps<D, Date>) =>
  format(cell.value, "MMMM dd, yyyy h:mm a");

export default DateCell;
