import { useApi } from "hooks";
import { useEffect, useState } from "react";
import StreamOverviewBox from "./StreamOverviewBox";
import MultistreamTargetsTable from "./MultistreamTargetsTable";
import SessionsTable from "./SessionsTable";
import { Text } from "@livepeer/design-system";

const StreamOverviewTab = ({ id, stream, streamHealth, invalidateStream }) => {
  const { getIngest } = useApi();

  const [ingest, setIngest] = useState(null);

  useEffect(() => {
    getIngest(true)
      .then((ingest) => {
        if (Array.isArray(ingest)) {
          ingest.sort((a, b) => a.base.localeCompare(b.base));
        }
        if ((ingest?.length ?? 0) > 0) {
          setIngest(ingest?.[0]);
        }
      })
      .catch((err) => console.error(err)); // todo: surface this
  }, [id]);

  const playbackId = (stream || {}).playbackId || "";

  let globalPlaybackUrl = "";

  if (ingest) {
    globalPlaybackUrl = `${ingest?.playback ?? ""}/${playbackId}/index.m3u8`;
  }

  return (
    <>
      <StreamOverviewBox
        stream={stream}
        globalPlaybackUrl={globalPlaybackUrl}
        invalidateStream={invalidateStream}
      />
      <MultistreamTargetsTable
        stream={stream}
        streamHealth={streamHealth}
        invalidateStream={invalidateStream}
        css={{ mb: "$7", mt: "$5" }}
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
