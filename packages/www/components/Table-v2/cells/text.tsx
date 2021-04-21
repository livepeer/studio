import Link from "next/link";
import ReactTooltip from "react-tooltip";
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
  const pid = 'tooltip-' +  cell.value.id;
  return (
    <div>
      {cell.value.tooltipChildren ? (
        <ReactTooltip
          id={pid}
          className="tooltip"
          place="top"
          type="dark"
          effect="solid">
          {cell.value.tooltipChildren}
        </ReactTooltip>
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
