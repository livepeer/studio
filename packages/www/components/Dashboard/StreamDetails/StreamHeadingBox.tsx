import { Box, Heading, Flex, Badge, Tooltip } from "@livepeer/design-system";
import { HealthStatus } from "hooks/use-analyzer";
import StatusBadge, { Variant } from "../StatusBadge";
import { PauseIcon, PlayIcon } from "@radix-ui/react-icons";
import { Stream } from "livepeer";

export type StreamHeadingBoxProps = {
  stream: Stream & { suspended?: boolean };
  concurrentViews?: number;
  healthState: Variant;
  streamHealth?: HealthStatus;
};

const StreamHeadingBox = ({
  stream,
  concurrentViews,
  healthState,
  streamHealth,
}: StreamHeadingBoxProps) => {
  return (
    <Flex
      justify="between"
      align="end"
      css={{
        pb: "$3",
        mb: "$5",
        width: "100%",
      }}>
      <Heading size="2">
        <Flex css={{ ai: "center" }}>
          <Box
            css={{
              fontWeight: 600,
              letterSpacing: "0",
              mr: "$2",
            }}>
            {stream.name}
          </Box>
          {!healthState ? null : (
            <StatusBadge
              variant={healthState}
              timestamp={streamHealth?.healthy?.lastProbeTime}
              css={{ mt: "$1", letterSpacing: 0 }}
            />
          )}
          {concurrentViews != undefined ? (
            <Tooltip
              css={{ bc: "$neutral3", color: "$neutral3" }}
              content={
                <Box css={{ color: "$hiContrast" }}>
                  This is the number of users watching this stream right now.
                </Box>
              }>
              <Flex align="center" css={{ mr: "$3", fontSize: "$2" }}>
                <Box as={PlayIcon} css={{ mr: "$1" }} /> {concurrentViews}{" "}
                viewers
              </Flex>
            </Tooltip>
          ) : null}
          {stream.suspended && (
            <Badge
              size="2"
              variant="red"
              css={{
                ml: "$1",
                mt: "$1",
                letterSpacing: 0,
              }}>
              <Box css={{ mr: 5 }}>
                <PauseIcon />
              </Box>
              Suspended
            </Badge>
          )}
        </Flex>
      </Heading>
    </Flex>
  );
};

export default StreamHeadingBox;
