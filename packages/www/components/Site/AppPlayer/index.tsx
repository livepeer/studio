import { Player } from "@livepeer/react";
import mux from "mux-embed";
import { memo, useCallback } from "react";

interface AppPlayerProps {
  playbackUrl: string;
  autoPlay?: boolean;
}

const AppPlayer = ({ playbackUrl, autoPlay = true }: AppPlayerProps) => {
  const mediaElementRef = useCallback((element: HTMLMediaElement) => {
    mux.monitor(element, {
      debug: false,
      data: {
        env_key: "8oj27fenun6v4ffvrgn6ehc7m",
        player_name: "Studio Dashboard Player",
        player_env: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
      },
    });
  }, []);

  return (
    <Player
      src={playbackUrl}
      autoPlay={autoPlay}
      objectFit="contain"
      mediaElementRef={mediaElementRef}
    />
  );
};

export default AppPlayer;
