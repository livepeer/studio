import { useEffect, useState } from "react";
import { Player } from "@livepeer/react";
import mux from "mux-embed";
import { memo, useCallback } from "react";

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

  const mediaElementRef = useCallback((element: HTMLMediaElement) => {
    mux.monitor(element, {
      debug: false,
      data: {
        env_key: "8oj27fenun6v4ffvrgn6ehc7m",
        player_name: "Studio Blog Player",
        player_env: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
      },
    });
  }, []);

  if (!playbackUrl) return <></>;

  return (
    <Player
      src={playbackUrl}
      autoPlay={false}
      muted={false}
      loop={false}
      mediaElementRef={mediaElementRef}
    />
  );
};

export default BlogPlayer;
