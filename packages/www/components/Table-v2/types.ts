import { CellProps } from 'react-table'
export type TableData = Record<string, unknown>

export type CellComponentProps<
  D extends TableData,
  T
> = React.PropsWithChildren<CellProps<D, T>>
