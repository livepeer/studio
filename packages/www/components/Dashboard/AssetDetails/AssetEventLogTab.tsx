import { Asset } from "@livepeer.studio/api";
import { Text, Box, Heading } from "@livepeer/design-system";
import { useApi } from "hooks";
import { useEffect } from "react";

type AssetEvent = {
  type: "uploaded";
}

const AssetEventLogTab = ({ asset }: { asset: Asset }) => {
  const { getTasks, user } = useApi();

  useEffect(() => {
    async function fn() {
      if (user?.id) {
        const [tasks] = await getTasks(user.id);
        console.log({
          tasks: tasks.filter(
            (task) =>
              task.outputAssetId === asset.id || task.inputAssetId === asset.id
          ),
        });
      }
    }
    fn();
  }, [getTasks, user?.id]);

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
