import {
  Badge,
  Box,
  Button,
  Flex,
  Status,
  Tooltip,
} from "@livepeer/design-system";
import { Broadcast as LivepeerBroadcast } from "@livepeer/react";
import { Share2Icon } from "@radix-ui/react-icons";
import { Stream } from "livepeer";
import AssetSharePopup from "../../AssetDetails/AssetSharePopup";

import { useEffect, useMemo, useState } from "react";
import { FiKey, FiVideo } from "react-icons/fi";
import ActiveStream from "./ActiveStream";
import StreamSetupBox from "../StreamSetupBox";
import { FaKey, FaVideo } from "react-icons/fa";

export type StreamPlayerBoxProps = {
  stream: Stream;
  onEmbedVideoClick: () => void;
  globalIngestUrl: string;
  globalSrtIngestUrl: string;
  globalPlaybackUrl: string;
  invalidateStream: () => void;
};

const StreamPlayerBox = ({
  stream,
  onEmbedVideoClick,
  globalIngestUrl,
  globalSrtIngestUrl,
  globalPlaybackUrl,
  invalidateStream,
}: StreamPlayerBoxProps) => {
  const [activeTab, setSwitchTab] = useState<"Browser" | "Streaming Software">(
    "Browser"
  );
  const [showBroadcast, setShowBroadcast] = useState(false);

  const isStreamActiveFromExternal = useMemo(
    () => !showBroadcast && stream.isActive,
    [showBroadcast, stream.isActive]
  );

  useEffect(() => {
    if (isStreamActiveFromExternal) {
      setSwitchTab("Streaming Software");
    }
  }, [isStreamActiveFromExternal]);

  useEffect(() => {
    if (showBroadcast) {
      setSwitchTab("Browser");
    }
  }, [showBroadcast]);

  return (
    <Box
      css={{
        maxWidth: "470px",
        justifySelf: "flex-end",
        width: "100%",
      }}>
      <Box
        css={{
          borderRadius: "$3",
          position: "relative",
          mb: "$5",
        }}>
        <Box
          css={{
            width: "100%",
            minHeight: 250,
            borderRadius: "$2",
            position: "relative",
            bc: "$panel",
            border: "1px solid $neutral6",
            overflow: "hidden",
          }}>
          {showBroadcast ? (
            <LivepeerBroadcast streamKey={stream.streamKey} />
          ) : stream.isActive ? (
            <ActiveStream playbackId={stream.playbackId} />
          ) : (
            <>
              <Badge
                size="2"
                css={{
                  backgroundColor: "$neutral7",
                  position: "absolute",
                  zIndex: 1,
                  left: 10,
                  top: 10,
                  letterSpacing: 0,
                }}>
                <Box css={{ mr: 5 }}>
                  <Status css={{ backgroundColor: "$neutral9" }} size="1" />
                </Box>
                Idle
              </Badge>
            </>
          )}
        </Box>
        <Flex css={{ mt: "$2", mb: "$1" }} gap="2" align="center">
          <AssetSharePopup
            playbackId={stream.playbackId}
            triggerNode={
              <Button size="2">
                <Box
                  as={Share2Icon}
                  css={{
                    mr: "$1",
                    flex: 1,
                  }}
                />
                Share
              </Button>
            }
            onEmbedVideoClick={onEmbedVideoClick}
          />
          <Tooltip
            content={
              isStreamActiveFromExternal
                ? "Your stream is currently active - stop streaming before attempting to go live from the browser."
                : "Go live from the browser, instantly"
            }>
            <Button
              size="2"
              css={{
                flex: 2,
              }}
              disabled={isStreamActiveFromExternal}
              onClick={() => setShowBroadcast((prev) => !prev)}>
              <Box
                as={FiVideo}
                css={{
                  mr: "$1",
                }}
              />
              {showBroadcast ? "Stop broadcast" : "Go live"}
            </Button>
          </Tooltip>
        </Flex>
      </Box>
      <Box
        css={{
          display: "flex",
          backgroundColor: "$neutral3",
          borderRadius: "$1",
          fontWeight: 600,
          fontSize: "$2",
        }}>
        <Box
          as="div"
          onClick={() => {
            if (!isStreamActiveFromExternal) setSwitchTab("Browser");
          }}
          css={{
            display: "flex",
            gap: "$1",
            m: "$1",
            p: "$2",
            borderRadius: "$1",
            width: "100%",
            cursor: isStreamActiveFromExternal ? "not-allowed" : "default",
            textDecoration: "none",
            alignItems: "center",
            justifyContent: "center",
            color: activeTab === "Browser" ? "$neutral1" : "inherit",
            backgroundColor:
              activeTab === "Browser" ? "$neutral12" : "transparent",
          }}>
          <FaVideo />
          Browser
        </Box>
        <Box
          as="div"
          onClick={() => setSwitchTab("Streaming Software")}
          css={{
            display: "flex",
            gap: "$1",
            m: "$1",
            p: "$2",
            borderRadius: "$1",
            width: "100%",
            cursor: "default",
            textDecoration: "none",
            alignItems: "center",
            justifyContent: "center",
            color: activeTab === "Streaming Software" ? "$neutral1" : "inherit",
            backgroundColor:
              activeTab === "Streaming Software" ? "$neutral12" : "transparent",
          }}>
          <FaKey />
          Streaming Software
        </Box>
      </Box>
      <StreamSetupBox
        activeTab={activeTab}
        stream={stream}
        globalIngestUrl={globalIngestUrl}
        globalSrtIngestUrl={globalSrtIngestUrl}
        globalPlaybackUrl={globalPlaybackUrl}
        invalidateStream={invalidateStream}
      />
    </Box>
  );
};

export default StreamPlayerBox;
