import StreamDetail from "layouts/streamDetail";
import StreamSessionsTable from "components/Dashboard/SessionsTable";
import MultistreamTargetsTable from "@components/Dashboard/MultistreamTargetsTable";
import { useRouter } from "next/router";
import { Text } from "@livepeer.com/design-system";
import { useCallback } from "react";
import { useApi, useAnalyzer } from "hooks";
import { Stream } from "@livepeer.com/api";
import { useQuery, useQueryClient } from "react-query";

const refetchInterval = 5 * 1000;

const Overview = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getStream } = useApi();
  const { getHealth } = useAnalyzer();

  const { query } = router;
  const id = query.id as string;

  const { data: stream } = useQuery([id], () => getStream(id), {
    refetchInterval,
  });
  const invalidateStream = useCallback(
    (optimistic?: Stream) => {
      if (optimistic) {
        queryClient.setQueryData([id], optimistic);
      }
      return queryClient.invalidateQueries([id]);
    },
    [queryClient, id]
  );
  const { data: streamHealth } = useQuery({
    queryKey: ["health", stream?.region, stream?.id, stream?.isActive],
    queryFn: async () =>
      !stream?.region ? null : await getHealth(stream.region, stream.id),
    refetchInterval,
  });

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
    </StreamDetail>
  );
};

export default Overview;
