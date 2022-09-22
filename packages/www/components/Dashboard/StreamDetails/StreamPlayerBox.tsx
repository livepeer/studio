import { Box, Badge, Status, Flex, Button } from "@livepeer/design-system";
import { Share2Icon } from "@radix-ui/react-icons";
import { Stream } from "livepeer";
import AssetSharePopup from "../AssetDetails/AssetSharePopup";
import Player from "../Player";

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
          overflow: "hidden",
          position: "relative",
          mb: "$2",
        }}>
        {stream.isActive ? (
          <>
            <Badge
              size="2"
              variant="green"
              css={{
                position: "absolute",
                zIndex: 1,
                left: 10,
                top: 10,
                letterSpacing: 0,
              }}>
              <Box css={{ mr: 5 }}>
                <Status size="1" variant="green" />
              </Box>
              Active
            </Badge>
            <Player src={globalPlaybackUrl} />
          </>
        ) : (
          <Box
            css={{
              width: "100%",
              height: 265,
              borderRadius: "$2",
              overflow: "hidden",
              position: "relative",
              bc: "#28282c",
            }}>
            <Badge
              size="2"
              css={{
                backgroundColor: "$primary7",
                position: "absolute",
                zIndex: 1,
                left: 10,
                top: 10,
                letterSpacing: 0,
              }}>
              <Box css={{ mr: 5 }}>
                <Status css={{ backgroundColor: "$primary9" }} size="1" />
              </Box>
              Idle
            </Badge>
          </Box>
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
              <Button size="2" onClick={() => {}} ghost={true}>
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
