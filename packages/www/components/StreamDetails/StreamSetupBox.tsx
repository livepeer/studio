import { Box, Flex, Heading, Link, Text } from "@livepeer/design-system";
import { Stream } from "@livepeer.studio/api";
import ClipButton from "../Clipping/ClipButton";
import ShowURL from "../ShowURL";
import { isStaging } from "lib/utils";
import { useJune, events } from "hooks/use-june";

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
  const broadcastIframeUrl = isStaging()
    ? `https://monster.lvpr.tv/broadcast/${stream.streamKey}`
    : `https://lvpr.tv/broadcast/${stream.streamKey}`;

  const June = useJune();

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
              fontSize: "$4",
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
              'Check that your camera and microphone inputs are properly working before clicking the "Go live" button above. You can also share the embeddable broadcast URL below with creators, or embed it as an iframe in your application.'
            )}
          </Text>
          <Box
            css={{
              mt: "$4",
              fontSize: "$3",
              fontWeight: 600,
              color: "$hiContrast",
            }}>
            {activeTab === "Streaming Software"
              ? "Stream key"
              : "Embeddable broadcast"}
          </Box>
          <Text
            variant="neutral"
            css={{ fontSize: "$2", mt: "$2" }}
            onClick={() => June.track(events.stream.keyCopy)}>
            <ClipButton
              value={
                activeTab === "Streaming Software"
                  ? stream.streamKey
                  : broadcastIframeUrl
              }
              text={
                activeTab === "Streaming Software"
                  ? stream.streamKey
                  : broadcastIframeUrl
              }
            />
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
