import { CellProps, Row } from "react-table";
export type TableData = Record<string, unknown>;

export type CellComponentProps<
  D extends TableData,
  T
> = React.PropsWithChildren<CellProps<D, T>>;

export type SortTypeArgs = [
  rowA: Row<Record<string, any>>,
  rowB: Row<Record<string, any>>,
  columnId: string,
  desc: boolean
];
export type SortFn = (
  path: string,
  rowA: Row<Record<string, any>>,
  rowB: Row<Record<string, any>>,
  columnId: string,
  desc: boolean
) => number;
