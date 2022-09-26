import { Box } from "@livepeer/design-system";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

export const displayReadyAssetName = (assetName: string) =>
  assetName.length > 24
    ? assetName.replace(assetName.slice(18, assetName.length - 6), "...")
    : assetName;

export const makeNameSectionChildren = (
  isStatusFailed: boolean,
  assetName: string
) =>
  isStatusFailed ? (
    <Box
      css={{
        display: "flex",
        alignItems: "center",
        gap: "$1",
        color: "$red11",
      }}>
      <ExclamationTriangleIcon />
      {assetName}
    </Box>
  ) : (
    assetName
  );
