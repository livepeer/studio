import { useApi } from "hooks";
import { useEffect, useState } from "react";
import StreamOverviewBox from "./StreamOverviewBox";

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
    </>
  );
};

export default StreamOverviewTab;
