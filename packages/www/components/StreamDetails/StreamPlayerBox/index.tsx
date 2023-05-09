import { Box, Flex, Button } from "@livepeer/design-system";
import { Share2Icon } from "@radix-ui/react-icons";
import { Stream } from "livepeer";
import AssetSharePopup from "../../AssetDetails/AssetSharePopup";
import ActiveStream from "./ActiveStream";
import IdleStream from "./IdleStream";

export type StreamPlayerBoxProps = {
  stream: Stream;
  globalPlaybackUrl: string;
  onEmbedVideoClick: () => void;
};

const StreamPlayerBox = ({
  stream,
  globalPlaybackUrl,
  onEmbedVideoClick,
}: StreamPlayerBoxProps) => {
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
          overflow: stream.isActive ? "hidden" : "visible",
          position: "relative",
          mb: "$2",
        }}>
        {stream.isActive ? (
          <ActiveStream playbackUrl={globalPlaybackUrl} />
        ) : (
          <IdleStream />
        )}
      </Box>
      <Box
        css={{
          mb: "$5",
        }}>
        <Flex align="center">
          <AssetSharePopup
            playbackId={stream.playbackId}
            triggerNode={
              <Button size="2" ghost={true}>
                <Box
                  as={Share2Icon}
                  css={{
                    mr: "$1",
                  }}
                />
                Share
              </Button>
            }
            onEmbedVideoClick={onEmbedVideoClick}
          />
        </Flex>
      </Box>
    </Box>
  );
};

export default StreamPlayerBox;
