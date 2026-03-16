import { Box, Flex, Status, Tooltip } from "@livepeer/design-system";
import { Broadcast as LivepeerBroadcast } from "@livepeer/react";
import { Share2Icon } from "@radix-ui/react-icons";
import { Stream } from "@livepeer.studio/api";
import AssetSharePopup from "../../AssetDetails/AssetSharePopup";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FaKey, FaVideo } from "react-icons/fa";
import { FiVideo } from "react-icons/fi";
import StreamSetupBox from "../StreamSetupBox";
import ActiveStream from "./ActiveStream";
import { useJune, events } from "hooks/use-june";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";

export type StreamPlayerBoxProps = {
  stream: Stream;
  onEmbedVideoClick: () => void;
  globalIngestUrl: string;
  globalSrtIngestUrl: string;
  globalPlaybackUrl: string;
  invalidateStream: () => void;

  isBroadcastLive: boolean;
  setIsBroadcastLive: Dispatch<SetStateAction<boolean>>;
};

const StreamPlayerBox = ({
  stream,
  onEmbedVideoClick,
  globalIngestUrl,
  globalSrtIngestUrl,
  globalPlaybackUrl,
  invalidateStream,
  isBroadcastLive,
  setIsBroadcastLive,
}: StreamPlayerBoxProps) => {
  const [activeTab, setSwitchTab] = useState<"Browser" | "Streaming Software">(
    "Browser",
  );
  const June = useJune();

  const isStreamActiveFromExternal = useMemo(
    () => !isBroadcastLive && stream.isActive,
    [isBroadcastLive, stream.isActive],
  );

  useEffect(() => {
    if (isStreamActiveFromExternal) {
      setSwitchTab("Streaming Software");
    }
  }, [isStreamActiveFromExternal]);

  useEffect(() => {
    if (isBroadcastLive) {
      setSwitchTab("Browser");
    }
  }, [isBroadcastLive]);

  const trackEventEmbed = useCallback(() => {
    if (June) June.track(events.stream.embed);
  }, [June]);

  const trackEventGoLive = useCallback(() => {
    if (June) June.track(events.stream.goLive);
  }, [June]);

  return (
    <div className="max-w-[470px] justify-self-end w-full">
      <div className="rounded-lg relative mb-5">
        <div className="w-full rounded-md relative bg-background border border-input overflow-hidden min-h-[220px]">
          {isBroadcastLive ? (
            <LivepeerBroadcast streamKey={stream.streamKey} />
          ) : stream.isActive ? (
            <ActiveStream playbackId={stream.playbackId} />
          ) : (
            <>
              <Badge className="absolute z-10 left-2 top-2 ">
                <div className="mr-1">
                  <Status css={{ backgroundColor: "$neutral9" }} size="1" />
                </div>
                Idle
              </Badge>
            </>
          )}
        </div>
        <Flex css={{ mt: "$2", mb: "$1" }} gap="2" align="center">
          <AssetSharePopup
            playbackId={stream.playbackId}
            triggerNode={
              <Button variant="outline">
                <Share2Icon className="mr-1" />
                Share
              </Button>
            }
            onEmbedVideoClick={() => {
              trackEventEmbed();
              return onEmbedVideoClick();
            }}
          />
          <Tooltip
            content={
              isStreamActiveFromExternal
                ? "Your stream is currently active - stop streaming before attempting to go live from the browser."
                : "Go live from the browser, instantly"
            }>
            <Button
              className="w-full"
              variant="secondary"
              disabled={isStreamActiveFromExternal}
              onClick={() =>
                setIsBroadcastLive((prev) => {
                  prev && trackEventGoLive();
                  return !prev;
                })
              }>
              <FiVideo className="mr-1" />

              {isBroadcastLive ? "Stop broadcast" : "Go live"}
            </Button>
          </Tooltip>
        </Flex>
      </div>
      <div className="flex flex-row bg-background border border-input rounded-md font-semibold text-sm">
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
      </div>
      <StreamSetupBox
        activeTab={activeTab}
        stream={stream}
        globalIngestUrl={globalIngestUrl}
        globalSrtIngestUrl={globalSrtIngestUrl}
        globalPlaybackUrl={globalPlaybackUrl}
        invalidateStream={invalidateStream}
      />
    </div>
  );
};

export default StreamPlayerBox;
