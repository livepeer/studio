/** @jsx jsx */
import { jsx } from "theme-ui";
import { useState } from "react";
import dynamic from "next/dynamic";

const Player = dynamic(import("../../components/Player"), { ssr: false });

type Props = {
  title: string;
  description?: string;
  manifestUrl: string;
  withOverflow?: boolean;
  setVideo?: React.Dispatch<React.SetStateAction<boolean>>;
  smallDescription?: boolean;
};

const VideoContainer = ({
  title,
  description,
  manifestUrl,
  withOverflow,
  setVideo,
  smallDescription,
}: Props) => {
  const videoThumbnail = "https://i.vimeocdn.com/video/499134794_1280x720.jpg";

  return (
    <div
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}>
      <div>
        <h1 sx={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px" }}>
          {title}
        </h1>
        <p
          sx={{
            fontSize: smallDescription ? "14px" : "16px",
            color: smallDescription ? "#8F8F8F" : "offBlack",
            marginTop: smallDescription ? '4px' : '',
            marginBottom: "32px",
          }}>
          {description}
        </p>
      </div>
      {manifestUrl ? (
        <div sx={{ borderRadius: "8px", overflow: "hidden" }}>
          <Player
            setVideo={setVideo}
            src={manifestUrl}
            posterUrl={videoThumbnail}
            config={{
              abr: { enabled: false },
              controlPanelElements: [
                "time_and_duration",
                "play_pause",
                "rewind",
                "fast_forward",
                "mute",
                "volume",
                "spacer",
                "fullscreen",
                withOverflow && "overflow_menu",
              ],
              overflowMenuButtons: [withOverflow && "quality"],
            }}
          />
        </div>
      ) : (
        <div
          sx={{
            background: "#FBFBFB",
            border: "1px solid #CCCCCC",
            borderRadius: "8px",
            height: ["183px", "250px", "312px"],
            width: "100%",
          }}
        />
      )}
    </div>
  );
};

export default VideoContainer;
