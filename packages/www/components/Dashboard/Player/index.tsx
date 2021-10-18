import { useRef, useEffect, useState } from "react";
import { Box } from "@livepeer.com/design-system";
import videojs from "video.js";
import "videojs-contrib-quality-levels";
import "videojs-hls-quality-selector";
import "video.js/dist/video-js.css";

const usePlayer = ({ src, controls, autoplay, muted }) => {
  const options = {
    fill: true,
    fluid: true,
    preload: "meta",
    responsive: true,
  };
  const videoRef = useRef(null);
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    const vjsPlayer = videojs(
      videoRef.current,
      {
        ...options,
        controls,
        autoplay,
        muted,
        sources: [{ src }],
      },
      () => {
        videoRef.current = vjsPlayer;
        vjsPlayer.hlsQualitySelector();
      }
    );
    setPlayer(vjsPlayer);

    return () => {
      if (player !== null) {
        player.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (player !== null) {
      player.src({ src });
    }
  }, [src]);

  return videoRef;
};

const VideoPlayer = ({
  src,
  controls = true,
  autoplay = true,
  muted = true,
}) => {
  const playerRef = usePlayer({ src, controls, autoplay, muted });

  return (
    <Box data-vjs-player>
      <Box
        as="video"
        ref={playerRef}
        css={{ width: "auto", height: 265, minHeight: 265 }}
        className="video-js vjs-big-play-centered"
      />
    </Box>
  );
};

export default VideoPlayer;
