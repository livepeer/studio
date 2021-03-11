import React, { useEffect, useRef } from "react";

// Use compiled versions of these libraries so they work with ad blockers
const muxjs = require("mux.js/dist/mux.js");
const shaka = require("shaka-player/dist/shaka-player.ui.js");

const Player = ({ src, posterUrl, config = {}, setVideo }) => {
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
    <div className="shadow-lg mx-auto max-w-full" ref={videoContainer}>
      <video
        onEmptied={() => {
          setVideo ? setVideo(false) : null
        }}
        onCanPlay={() => {
          setVideo ? setVideo(true) : null
        }}
        muted
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
