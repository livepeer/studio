import { VideoPlayer } from "@livepeer/react";
import { useRef } from "react";

interface PlayerProps {
  src: string;
  autoPlay?: boolean;
  controls?: boolean;
  width?: string;
}

export default function Player({
  src,
  autoPlay = true,
  controls = true,
  width = "100%",
}: PlayerProps) {
  const playerRef = useRef();
  return (
    <VideoPlayer
      src={src}
      playerRef={playerRef}
      autoPlay={autoPlay}
      controls={controls}
      width={width}
      style={{ display: "flex" }}
    />
  );
}
