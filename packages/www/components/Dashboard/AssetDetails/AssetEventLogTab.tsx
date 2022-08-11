import { Asset } from "@livepeer.studio/api";
import { Text, Box, Heading } from "@livepeer/design-system";

const AssetEventLogTab = ({ asset }: { asset: Asset }) => {
  return (
    <>
      <Box
        css={{
          borderBottom: "1px solid",
          borderColor: "$neutral6",
          pb: "$2",
          mb: "$7",
          width: "100%",
        }}>
        <Heading size="1" css={{ fontWeight: 500, mb: "$1" }}>
          Session bitrate
        </Heading>
        <Text variant="gray" size="3">
          After the stream loads, ingest rate updates every 10 seconds.
        </Text>
      </Box>
    </>
  );
};

export default AssetEventLogTab;
