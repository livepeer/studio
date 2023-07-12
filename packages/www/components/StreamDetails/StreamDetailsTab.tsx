import { Text } from "@livepeer/design-system";
import MultistreamTargetsTable from "components/StreamDetails/MultistreamTargetsTable";
import SessionsTable from "./SessionsTable";

const StreamDetailsTab = ({ id, stream, streamHealth, invalidateStream }) => {
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

export default StreamDetailsTab;
