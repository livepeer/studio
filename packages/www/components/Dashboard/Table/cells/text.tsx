import { Tooltip } from "@livepeer/design-system";
import { CellComponentProps, TableData } from "../types";
import { Box } from "@livepeer/design-system";

export type TextCellProps = {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  tooltipChildren?: React.ReactNode;
  href?: string;
  id?: string;
};

const TextCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, TextCellProps>) => {
  const pid = "tooltip-" + cell.value.id;
  return (
    <Box css={{ lineHeight: 1.5 }}>
      {cell.value.tooltipChildren ? (
        <Tooltip
          id={pid}
          className="tooltip"
          place="top"
          type="dark"
          effect="solid"
          delayShow={500}>
          {cell.value.tooltipChildren}
        </Tooltip>
      ) : null}
      <Box data-tip data-for={pid}>
        {cell.value.children}
      </Box>
    </Box>
  );
};

export default TextCell;
