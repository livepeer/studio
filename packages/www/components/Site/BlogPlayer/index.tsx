import { useEffect, useState } from "react";
import { Player } from "@livepeer/react";

const BlogPlayer = ({ assetId }) => {
  const [playbackUrl, setPlaybackUrl] = useState(null);

  useEffect(() => {
    (async () => {
      const response = await fetch(
        `https://dp4k3mpw.api.sanity.io/v1/data/doc/production/${assetId}`
      );
      const { documents } = await response.json();
      setPlaybackUrl(`https://stream.mux.com/${documents[0].playbackId}.m3u8`);
    })();
  }, []);

  if (!playbackUrl) return <></>;

  return (
    <Player src={playbackUrl} autoPlay={false} muted={false} loop={false} />
  );
};

export default BlogPlayer;
