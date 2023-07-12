import { Player } from "@livepeer/react";
import mux from "mux-embed";
import { memo, useCallback } from "react";

type AppPlayerProps = {
  playbackUrl?: string;
  playbackId?: string;
  autoPlay?: boolean;
  type: "asset" | "stream";
} & (
  | {
      playbackUrl: string;
    }
  | {
      playbackId: string;
    }
);

const AppPlayer = ({
  playbackUrl,
  playbackId,
  autoPlay = true,
  type,
}: AppPlayerProps) => {
  const mediaElementRef = useCallback((element: HTMLMediaElement) => {
    mux.monitor(element, {
      debug: false,
      data: {
        env_key: "8oj27fenun6v4ffvrgn6ehc7m",
        player_name: `Studio Dashboard Player (${
          type === "asset" ? "Asset" : "Stream"
        })`,
        player_env: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
      },
    });
  }, []);

  return (
    <Player
      src={playbackUrl}
      playbackId={playbackId}
      autoPlay={autoPlay}
      mediaElementRef={mediaElementRef}
      priority
      muted
      lowLatency
    />
  );
};

export default AppPlayer;
