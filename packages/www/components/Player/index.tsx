import React, { useEffect, useRef } from "react";
import muxjs from "mux.js";

const shaka = require("shaka-player/dist/shaka-player.ui.js");

const Player = ({ src, licenseServer, posterUrl }) => {
  const video: any = useRef(null);
  const videoContainer: any = useRef(null);
  const controller: any = useRef({});

  useEffect(() => {
    window["muxjs"] = muxjs;
    const player = new shaka.Player(video.current);
    const ui = new shaka.ui.Overlay(
      player,
      videoContainer.current,
      video.current
    );

    // Store Shaka's API in order to expose it as a handle.
    controller.current = {
      player,
      ui,
      videoElement: video.current,
      config: {}
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
      player.load(src);
    }
  }, [src]);

  return (
    <div className="shadow-lg mx-auto max-w-full" ref={videoContainer}>
      <video
        autoPlay
        id="video"
        ref={video}
        className="w-full h-full"
        poster={posterUrl}
      />
    </div>
  );
};

export default Player;
