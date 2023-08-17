import { Box, Heading, Flex, Tooltip } from "@livepeer/design-system";
import { PlayIcon, CalendarIcon } from "@radix-ui/react-icons";
import { Asset } from "livepeer";
import RelativeTime from "../RelativeTime";

export type AssetHeadingBoxProps = {
  asset?: Asset;
  totalViews: number;
};

const AssetHeadingBox = ({ asset, totalViews }: AssetHeadingBoxProps) => {
  return (
    <Box
      css={{
        mb: "$5",
        width: "100%",
      }}>
      <Heading size="2" css={{ mb: "$3" }}>
        <Flex css={{ ai: "center" }}>
          <Box
            css={{
              fontWeight: 600,
              letterSpacing: "0",
              mr: "$2",
            }}>
            {asset.name.length > 26
              ? `${asset.name.slice(0, 26)}...`
              : asset.name}
          </Box>
        </Flex>
      </Heading>
      <Flex align="center">
        {totalViews != undefined ? (
          <Tooltip
            css={{ bc: "$neutral3", color: "$neutral3" }}
            content="Views are defined as at least 1 second of watch time">
            <Flex align="center" css={{ mr: "$3", fontSize: "$2" }}>
              <Box as={PlayIcon} css={{ mr: "$1" }} /> {totalViews} views
            </Flex>
          </Tooltip>
        ) : null}
        <Flex align="center" css={{ fontSize: "$2" }}>
          <Box as={CalendarIcon} css={{ mr: "$1" }} />
          <RelativeTime
            id="cat"
            prefix="createdat"
            tm={asset.createdAt}
            swap={true}
          />
        </Flex>
      </Flex>
    </Box>
  );
};

export default AssetHeadingBox;
