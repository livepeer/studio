/** @jsx jsx */
import { jsx } from "theme-ui";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Box } from "@theme-ui/components";

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
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}>
      <div>
        <Box
          as="h1"
          sx={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px" }}>
          {title}
        </Box>
        <Box
          as="p"
          sx={{
            fontSize: smallDescription ? "14px" : "16px",
            color: smallDescription ? "#8F8F8F" : "offBlack",
            marginTop: smallDescription ? "4px" : "",
            marginBottom: "32px",
          }}>
          {description}
        </Box>
      </div>
      {manifestUrl ? (
        <Box sx={{ borderRadius: "8px", overflow: "hidden" }}>
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
        </Box>
      ) : (
        <Box
          sx={{
            background: "#FBFBFB",
            border: "1px solid #CCCCCC",
            borderRadius: "8px",
            height: ["183px", "250px", "312px"],
            width: "100%",
          }}
        />
      )}
    </Box>
  );
};

export default VideoContainer;
