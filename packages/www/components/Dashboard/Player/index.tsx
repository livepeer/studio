import { useEffect, useRef } from "react";
import { Box } from "@livepeer.com/design-system";
import muxjs from "mux.js/dist/mux.js";

const Player = ({
  src,
  posterUrl = "https://i.vimeocdn.com/video/499134794_1280x720.jpg",
  config = {},
  setVideo,
}) => {
  const video: any = useRef(null);
  const videoContainer: any = useRef(null);
  const controller: any = useRef({});

  useEffect(() => {
    window["muxjs"] = muxjs;

    // Use compiled versions of these libraries so they work with ad blockers
    const shaka = require("shaka-player/dist/shaka-player.ui.js");

    const player = new shaka.Player(video.current);
    const ui = new shaka.ui.Overlay(
      player,
      videoContainer.current,
      video.current
    );

    ui.configure(config);

    // Store Shaka's API in order to expose it as a handle.
    controller.current = {
      player,
      ui,
      videoElement: video.current,
      config: {},
    };

    return () => {
      player.destroy();
      ui.destroy();
    };
  }, []);

  // Load the source url when we have one.
  useEffect(() => {
    const { player } = controller.current;
    if (player) {
      player.load(src.trim());
    }
  }, [src]);

  return (
    <Box className="shadow-lg mx-auto max-w-full" ref={videoContainer}>
      <video
        onEmptied={() => {
          setVideo ? setVideo(false) : null;
        }}
        onCanPlay={() => {
          setVideo ? setVideo(true) : null;
        }}
        muted
        autoPlay
        id="video"
        ref={video}
        className="w-full h-full"
        poster={posterUrl}
      />
    </Box>
  );
};

export default Player;
