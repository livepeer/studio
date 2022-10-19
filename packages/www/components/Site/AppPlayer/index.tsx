import { Player } from "@livepeer/react";

interface AppPlayerProps {
  playbackUrl: string;
  autoPlay?: boolean;
}

const AppPlayer = ({ playbackUrl, autoPlay = true }: AppPlayerProps) => (
  <Player
    src={playbackUrl}
    autoPlay={autoPlay}
    objectFit="contain"
    theme={{
      colors: {
        accent: "$colors$blue10",
      },
    }}
  />
);

export default AppPlayer;
