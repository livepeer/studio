import { Box, Text } from "@livepeer/design-system";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Asset } from "@livepeer.studio/api";
import Item from "./Item";

const MAX_FILENAME_LENGTH = 20;

const AssetFailedStatusItem = ({ asset }: { asset: Asset }) => {
  const { id, name } = asset;

  const mainChildren = (
    <Text variant="red">
      {name?.length > MAX_FILENAME_LENGTH
        ? `${name.slice(0, MAX_FILENAME_LENGTH)}...`
        : name ?? ""}
    </Text>
  );

  const secondaryChildren = (
    <Text size="1" variant="red">
      Internal error processing file
    </Text>
  );

  const accessoryChildren = (
    <Box
      as={ExclamationTriangleIcon}
      css={{ align: "right", color: "$red11" }}
    />
  );

  return (
    <Item
      itemKey={`asset-failed-status-item-${id}`}
      mainChildren={mainChildren}
      secondaryChildren={secondaryChildren}
      accessoryChildren={accessoryChildren}
    />
  );
};

export default AssetFailedStatusItem;
