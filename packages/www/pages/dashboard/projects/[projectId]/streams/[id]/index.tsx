import { useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useQuery, useQueryClient } from "react-query";
import { Stream } from "@livepeer.studio/api";
import { useApi, useAnalyzer } from "hooks";
import StreamDetail from "layouts/streamDetail";
import StreamHealthTab from "components/StreamDetails/StreamHealthTab";
import StreamOverviewTab from "components/StreamDetails/StreamOverviewTab";
import Ripe, { categories, pages } from "lib/ripe";
import useProject from "hooks/use-project";

Ripe.trackPage({
  category: categories.DASHBOARD,
  name: pages.STREAM,
});

const refetchInterval = 5 * 1000;

const StreamDetails = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getStream } = useApi();
  const { getHealth } = useAnalyzer();
  const { appendProjectId } = useProject();
  const [currentTab, setCurrentTab] = useState<"Overview" | "Health">(
    "Overview"
  );
  const [embedVideoDialogOpen, setEmbedVideoDialogOpen] = useState(false);

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
      activeTab={currentTab}
      stream={stream}
      streamHealth={streamHealth}
      invalidateStream={invalidateStream}
      setSwitchTab={setCurrentTab}
      breadcrumbs={[
        { title: "Streams", href: appendProjectId("/streams") },
        { title: stream?.name },
      ]}
      embedVideoDialogOpen={embedVideoDialogOpen}
      setEmbedVideoDialogOpen={setEmbedVideoDialogOpen}>
      {currentTab === "Overview" ? (
        <StreamOverviewTab
          id={id}
          stream={stream}
          streamHealth={streamHealth}
          invalidateStream={invalidateStream}
        />
      ) : (
        <StreamHealthTab
          stream={stream}
          streamHealth={streamHealth}
          invalidateStream={invalidateStream}
        />
      )}
    </StreamDetail>
  );
};

export default StreamDetails;
