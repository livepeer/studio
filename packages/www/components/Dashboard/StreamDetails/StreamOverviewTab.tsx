import SessionsTable from "./SessionsTable";
import MultistreamTargetsTable from "components/Dashboard/StreamDetails/MultistreamTargetsTable";
import { Text } from "@livepeer/design-system";

const StreamOverviewTab = ({ id, stream, streamHealth, invalidateStream }) => {
  return (
    <>
      <MultistreamTargetsTable
        stream={stream}
        streamHealth={streamHealth}
        invalidateStream={invalidateStream}
        css={{ mb: "$7" }}
        emptyState={
          <Text variant="neutral" size="2">
            No targets
          </Text>
        }
        tableLayout="auto"
        border
      />
      <SessionsTable
        streamId={id}
        emptyState={
          <Text variant="neutral" size="2">
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
