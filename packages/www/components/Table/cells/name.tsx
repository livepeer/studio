import { CellComponentProps, TableData } from "../types";
import { Box } from "@livepeer/design-system";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Tooltip } from "react-tooltip";

export type NameCellProps = {
  id?: string;
  href?: string;
  name: string;
  isStatusFailed: boolean;
  errorMessage?: string;
};

const NameCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, NameCellProps>) => {
  const { id, name, isStatusFailed, errorMessage } = cell.value;

  const displayAssetName =
    name.length > 24
      ? name.replace(name.slice(18, name.length - 6), "...")
      : name;

  if (isStatusFailed) {
    const tooltipId = "tooltip-error-" + id;
    return (
      <>
        <Tooltip id={tooltipId} />
        <Box
          data-tooltip-id={tooltipId}
          data-tooltip-content={errorMessage}
          css={{
            display: "flex",
            alignItems: "center",
            gap: "$1",
            color: "$red11",
            lineHeight: 1.5,
          }}>
          <ExclamationTriangleIcon />
          {displayAssetName}
        </Box>
      </>
    );
  }

  return <Box css={{ lineHeight: 1.5 }}>{displayAssetName}</Box>;
};

export default NameCell;
