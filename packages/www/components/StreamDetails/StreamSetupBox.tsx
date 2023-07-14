import { Box, Flex, Heading, Link, Text } from "@livepeer/design-system";
import { Stream } from "livepeer";
import ClipButton from "../Clipping/ClipButton";
import ShowURL from "../ShowURL";

export type StreamSetupBoxProps = {
  activeTab: "Browser" | "Streaming Software";
  stream: Stream & { suspended?: boolean };
  globalIngestUrl: string;
  globalSrtIngestUrl: string;
  globalPlaybackUrl: string;
  invalidateStream: () => void;
};

const StreamSetupBox = ({
  activeTab,
  stream,
  globalIngestUrl,
  globalSrtIngestUrl,
  invalidateStream,
}: StreamSetupBoxProps) => {
  return (
    <>
      <Flex
        css={{
          mt: "$4",
          justifyContent: "flex-start",
          alignItems: "baseline",
          flexDirection: "column",
        }}>
        <Box
          css={{
            alignItems: "center",
            width: "100%",
            fontSize: "$2",
            position: "relative",
          }}>
          <Box
            css={{
              fontSize: "$3",
              fontWeight: 600,
              color: "$hiContrast",
            }}>
            {activeTab === "Streaming Software"
              ? "Streaming software setup"
              : "Go live from the browser"}
          </Box>
          <Text variant="neutral" css={{ fontSize: "$2", mt: "$2" }}>
            {activeTab === "Streaming Software" ? (
              <>
                Copy and paste the stream key into your streaming software. Use
                either the RTMP or SRT ingest, depending on your use-case. The
                RTMP ingest is more common with OBS users.{" "}
                <Link
                  css={{ mt: "$2" }}
                  target="_blank"
                  href="https://docs.livepeer.org/guides/developing/stream-via-obs">
                  Check out our docs for more details.
                </Link>
              </>
            ) : (
              'Check that your camera and microphone inputs are properly working before clicking the "Go live" button above.'
            )}
          </Text>
          {activeTab === "Streaming Software" && (
            <>
              <Box
                css={{
                  mt: "$4",
                  fontSize: "$3",
                  fontWeight: 600,
                  color: "$hiContrast",
                }}>
                Stream key
              </Box>
              <Text variant="neutral" css={{ fontSize: "$2", mt: "$2" }}>
                <ClipButton value={stream.streamKey} text={stream.streamKey} />
              </Text>
              <Box
                css={{
                  mt: "$4",
                  fontSize: "$3",
                  fontWeight: 600,
                  color: "$hiContrast",
                }}>
                RTMP ingest
              </Box>
              <Text variant="neutral" css={{ fontSize: "$2", mt: "$2" }}>
                <ShowURL url={globalIngestUrl} anchor={false} />
              </Text>
              <Box
                css={{
                  mt: "$4",
                  fontSize: "$3",
                  fontWeight: 600,
                  color: "$hiContrast",
                }}>
                SRT ingest
              </Box>
              <Text variant="neutral" css={{ fontSize: "$2", mt: "$2" }}>
                <ShowURL url={globalSrtIngestUrl} anchor={false} />
              </Text>
            </>
          )}
        </Box>
      </Flex>
    </>
  );
};

export default StreamSetupBox;
