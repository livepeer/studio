import StreamDetail from "layouts/streamDetail";
import StreamSessionsTable from "components/Dashboard/SessionsTable";
import MultistreamTargetsTable from "@components/Dashboard/MultistreamTargetsTable";
import { useRouter } from "next/router";
import { Text } from "@livepeer.com/design-system";
import { useCallback } from "react";
import { useApi } from "hooks";
import { Stream } from "@livepeer.com/api";
import { useQuery, useQueryClient } from "react-query";

const Overview = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getStream } = useApi();

  const { query } = router;
  const id = query.id as string;

  const fetcher = useCallback(async () => {
    const stream: Stream = await getStream(id);
    return stream;
  }, [id]);

  const { data: stream } = useQuery([id], () => fetcher());
  const invalidateStream = useCallback(() => {
    return queryClient.invalidateQueries(id);
  }, [queryClient, id]);

  return (
    <StreamDetail
      activeTab="Overview"
      stream={stream}
      invalidateStream={invalidateStream}
      breadcrumbs={[
        { title: "Streams", href: "/dashboard/streams" },
        { title: stream?.name },
      ]}>
      <MultistreamTargetsTable
        stream={stream}
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
    </StreamDetail>
  );
};

export default Overview;
