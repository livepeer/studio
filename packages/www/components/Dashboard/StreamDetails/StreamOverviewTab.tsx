import StreamSessionsTable from "@components/Dashboard/SessionsTable";
import MultistreamTargetsTable from "@components/Dashboard/MultistreamTargetsTable";
import { Text } from "@livepeer.com/design-system";

const StreamOverviewTab = ({ id, stream, streamHealth, invalidateStream }) => {
  return (
    <>
      <MultistreamTargetsTable
        stream={stream}
        streamHealth={streamHealth}
        invalidateStream={invalidateStream}
        css={{ mb: "$7" }}
        emptyState={
          <Text variant="gray" size="2">
            No targets
          </Text>
        }
        tableLayout="auto"
        border
      />
      <StreamSessionsTable
        streamId={id}
        emptyState={
          <Text variant="gray" size="2">
            No sessions
          </Text>
        }
        tableLayout="auto"
        border
      />
    </>
  );
};

export default StreamOverviewTab;
