import { Box, Badge, Status } from "@livepeer/design-system";
import { Stream } from "livepeer";
import Player from "../Player";

export type StreamPlayerBoxProps = {
  stream: Stream;
  globalPlaybackUrl: string;
};

const StreamPlayerBox = ({
  stream,
  globalPlaybackUrl,
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
          mb: "$7",
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
    </Box>
  );
};

export default StreamPlayerBox;
