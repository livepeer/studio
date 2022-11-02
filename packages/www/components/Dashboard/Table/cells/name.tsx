import { CellComponentProps, TableData } from "../types";
import { Box } from "@livepeer/design-system";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Tooltip } from "@livepeer/design-system";

export type NameCellProps = {
  id?: string;
  href?: string;
  assetName: string;
  isStatusFailed: boolean;
  errorMessage?: string;
};

const NameCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, NameCellProps>) => {
  const { id, assetName, isStatusFailed, errorMessage } = cell.value;

  const displayAssetName =
    assetName.length > 24
      ? assetName.replace(assetName.slice(18, assetName.length - 6), "...")
      : assetName;

  if (isStatusFailed) {
    const tooltipId = "tooltip-error-" + id;
    return (
      <>
        <Tooltip
          id={tooltipId}
          className="tooltip"
          place="top"
          type="dark"
          effect="solid"
          delayShow={500}>
          {errorMessage}
        </Tooltip>
        <Box
          data-tip
          data-for={tooltipId}
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
