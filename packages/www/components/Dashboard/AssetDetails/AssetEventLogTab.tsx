import { Asset } from "@livepeer.studio/api";
import { Text, Flex, Box, Heading } from "@livepeer/design-system";
import { useApi } from "hooks";
import { useEffect, useState } from "react";
import moment from "moment";
import Spinner from "../Spinner";

type AssetEvent = {
  type:
    | "url-import"
    | "file-import"
    | "recorded-session"
    | "ipfs-upload"
    | "other";
  timestamp: number;
};

const AssetEventLogTab = ({ asset }: { asset: Asset }) => {
  const { getTasks, user } = useApi();
  const [assetEvents, setAssetEvents] = useState<AssetEvent[]>([]);

  useEffect(() => {
    async function fn() {
      if (user?.id) {
        const [tasks] = await getTasks(user.id);

        const events: AssetEvent[] = tasks
          ?.filter(
            (task) =>
              task.outputAssetId === asset.id || task.inputAssetId === asset.id
          )
          ?.map((task) => ({
            type: task?.params?.import?.url
              ? "url-import"
              : task?.params?.import?.uploadedObjectKey
              ? "file-import"
              : task?.params?.import?.recordedSessionId
              ? "recorded-session"
              : task?.params?.export?.["ipfs"]
              ? "ipfs-upload"
              : "other",
            timestamp: task?.createdAt ?? Date.now(),
          }));

        setAssetEvents(events);
      }
    }
    fn();
  }, [getTasks, user?.id]);

  return (
    <>
      <Box
        css={{
          pb: "$3",
          width: "100%",
        }}>
        <Heading size="1" css={{ fontWeight: 500, mb: "$1" }}>
          Events
        </Heading>
      </Box>
      {assetEvents?.length > 0 ? (
        <Box>
          {assetEvents
            .filter((event) => event.type !== "other")
            .map((event) => (
              <Flex
                css={{
                  borderTop: "1px solid",
                  borderColor: "$neutral6",
                  pt: "$3",
                  mb: "$3",
                  width: "100%",
                  justifyContent: "space-between",
                }}>
                <Text variant="gray" size="3">
                  {event.type === "file-import"
                    ? "Asset created from file upload"
                    : event.type === "url-import"
                    ? "Asset created from URL import"
                    : event.type === "recorded-session"
                    ? "Asset created from recorded stream"
                    : event.type === "ipfs-upload"
                    ? "Uploaded to IPFS"
                    : "N/A"}
                </Text>
                <Text variant="gray" size="3">
                  {moment.unix(event.timestamp / 1000).format("lll")}
                </Text>
              </Flex>
            ))}
        </Box>
      ) : (
        <Box
          css={{
            borderTop: "1px solid",
            borderColor: "$neutral6",
            pt: "$3",
            mb: "$3",
            width: "100%",
          }}>
          <Spinner />
        </Box>
      )}
    </>
  );
};

export default AssetEventLogTab;
