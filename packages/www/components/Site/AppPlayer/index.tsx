import { Player } from "@livepeer/react";
import { memo, useMemo } from "react";

interface AppPlayerProps {
  playbackUrl: string;
  autoPlay?: boolean;
}

const AppPlayer = ({ playbackUrl, autoPlay = true }: AppPlayerProps) => (
  <Player src={playbackUrl} autoPlay={autoPlay} objectFit="contain" />
);

export default memo(AppPlayer);
