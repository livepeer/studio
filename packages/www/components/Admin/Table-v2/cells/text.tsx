/** @jsxImportSource @emotion/react */
import { jsx } from "theme-ui";
import Link from "next/link";
import { Tooltip } from "react-tooltip";
import { CellComponentProps, TableData } from "../types";

export type TextCellProps = {
  children?: React.ReactNode;
  tooltipChildren?: React.ReactNode;
  href?: string;
  id?: string;
};

const TextCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, TextCellProps>) => {
  const pid = "tooltip-" + cell.value.id;
  return (
    <div>
      {cell.value.tooltipChildren ? <Tooltip id={pid} /> : null}
      <div
        data-tooltip-id={pid}
        data-tooltip-content={`${cell?.value?.tooltipChildren}`}>
        {cell.value.href ? (
          <Link href={cell.value.href}>{cell.value.children}</Link>
        ) : (
          cell.value.children
        )}
      </div>
    </div>
  );
};

export default TextCell;
