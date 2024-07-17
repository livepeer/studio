import { Tooltip } from "react-tooltip";
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
      {cell.value.tooltipChildren ? <Tooltip id={pid} /> : null}
      <Box
        data-tooltip-id={pid}
        data-tooltip-content={`${cell?.value?.tooltipChildren}`}>
        {cell.value.children}
      </Box>
    </Box>
  );
};

export default TextCell;
