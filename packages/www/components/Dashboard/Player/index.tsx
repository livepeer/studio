import { useRef, useEffect } from "react";
import { Box } from "@livepeer.com/design-system";
import videojs from "video.js";
import "videojs-contrib-quality-levels";
import "videojs-hls-quality-selector";
import "video.js/dist/video-js.css";

export const Player = ({ options }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  const onReady = (player) => {
    playerRef.current = player;
    player.hlsQualitySelector();
  };

  useEffect(() => {
    // make sure Video.js player is only initialized once
    if (!playerRef.current) {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      const player = (playerRef.current = videojs(videoElement, options, () => {
        onReady && onReady(player);
      }));
    }
  }, [options, onReady]);

  // Dispose the Video.js player when the functional component unmounts
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <Box>
      <Box data-vjs-player>
        <Box
          as="video"
          muted
          autoPlay
          ref={videoRef}
          css={{ width: "auto", height: 265, minHeight: 265 }}
          className="video-js vjs-big-play-centered"
        />
      </Box>
    </Box>
  );
};

export default Player;
