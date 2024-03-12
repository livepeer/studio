import { Box, Heading, Flex, Badge } from "@livepeer/design-system";
import { HealthStatus } from "hooks/use-analyzer";
import StatusBadge, { Variant } from "../StatusBadge";
import { PauseIcon } from "@radix-ui/react-icons";
import { Stream } from "@livepeer.studio/api";

export type StreamHeadingBoxProps = {
  stream: Stream & { suspended?: boolean };
  healthState: Variant;
  streamHealth?: HealthStatus;
};

const StreamHeadingBox = ({
  stream,
  healthState,
  streamHealth,
}: StreamHeadingBoxProps) => {
  return (
    <Flex
      justify="between"
      align="end"
      css={{
        pb: "$3",
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
