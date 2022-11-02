/** @jsxImportSource @emotion/react */
import { jsx } from "theme-ui";
import Link from "next/link";
import { Tooltip } from "@livepeer/design-system";
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
      {cell.value.tooltipChildren ? (
        <Tooltip
          id={pid}
          className="tooltip"
          place="top"
          type="dark"
          effect="solid">
          {cell.value.tooltipChildren}
        </Tooltip>
      ) : null}
      <div data-tip data-for={pid}>
        {cell.value.href ? (
          <Link href={cell.value.href}>
            <a>{cell.value.children}</a>
          </Link>
        ) : (
          cell.value.children
        )}
      </div>
    </div>
  );
};

export default TextCell;
