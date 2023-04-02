import { Box, Heading, Flex, Button, Tooltip } from "@livepeer/design-system";
import ClipButton from "../Clipping/ClipButton";
import RelativeTime from "../RelativeTime";
import ShowURL from "../ShowURL";
import Record from "./Record";
import { QuestionMarkCircledIcon as Help } from "@radix-ui/react-icons";
import { useState } from "react";
import { Stream } from "livepeer";

const Cell = ({ children, css = {} }) => {
  return (
    <Flex align="center" css={{ height: 22, mb: "$3", ...css }}>
      {children}
    </Flex>
  );
};

export type StreamDetailsBoxProps = {
  stream: Stream & { suspended?: boolean };
  globalIngestUrl: string;
  globalSrtIngestUrl: string;
  globalPlaybackUrl: string;
  invalidateStream: () => void;
};

const StreamDetailsBox = ({
  stream,
  globalIngestUrl,
  globalSrtIngestUrl,
  globalPlaybackUrl,
  invalidateStream,
}: StreamDetailsBoxProps) => {
  const [keyRevealed, setKeyRevealed] = useState(false);
  return (
    <>
      <Box
        css={{
          borderBottom: "1px solid",
          borderColor: "$neutral6",
          pb: "$2",
          mb: "$4",
          width: "100%",
        }}>
        <Heading size="1" css={{ fontWeight: 600 }}>
          Details
        </Heading>
      </Box>
      <Flex
        css={{
          justifyContent: "flex-start",
          alignItems: "baseline",
          flexDirection: "column",
        }}>
        <Box
          css={{
            display: "grid",
            alignItems: "center",
            gridTemplateColumns: "10em auto",
            width: "100%",
            fontSize: "$2",
            position: "relative",
          }}>
          <Cell css={{ color: "$hiContrast" }}>Stream name</Cell>
          <Cell>{stream.name}</Cell>
          <Cell css={{ color: "$hiContrast" }}>Stream ID</Cell>
          <Cell>
            <ClipButton value={stream.id} text={stream.id} />
          </Cell>
          <Cell css={{ color: "$hiContrast" }}>Stream key</Cell>
          <Cell>
            {keyRevealed ? (
              <Flex>
                <ClipButton value={stream.streamKey} text={stream.streamKey} />
              </Flex>
            ) : (
              <Button type="button" onClick={() => setKeyRevealed(true)}>
                Reveal stream key
              </Button>
            )}
          </Cell>
          <Cell css={{ color: "$hiContrast" }}>RTMP ingest URL</Cell>
          <Cell>
            <ShowURL url={globalIngestUrl} anchor={false} />
          </Cell>
          <Cell css={{ color: "$hiContrast" }}>SRT ingest URL</Cell>
          <Cell>
            <ShowURL
              url={globalSrtIngestUrl}
              shortendUrl={globalSrtIngestUrl.replace(
                globalSrtIngestUrl.slice(38),
                "…"
              )}
              anchor={false}
            />
          </Cell>
          <Cell css={{ color: "$hiContrast" }}>Playback ID</Cell>
          <Cell>
            <ClipButton value={stream.playbackId} text={stream.playbackId} />
          </Cell>
          <Cell css={{ color: "$hiContrast" }}>Playback URL</Cell>
          <Cell>
            <ShowURL
              url={globalPlaybackUrl}
              shortendUrl={globalPlaybackUrl.replace(
                globalPlaybackUrl.slice(29, 45),
                "…"
              )}
              anchor={false}
            />
          </Cell>
          <Cell css={{ color: "$hiContrast" }}>Record sessions</Cell>
          <Cell>
            <Flex css={{ position: "relative", top: "2px" }}>
              <Box css={{ mr: "$2" }}>
                <Record stream={stream} invalidate={invalidateStream} />
              </Box>
              <Tooltip
                multiline
                content={
                  <Box>
                    When enabled, transcoded streaming sessions will be recorded
                    and stored by Livepeer Studio. Each recorded session will
                    have a recording .m3u8 URL for playback and an MP4 download
                    link. This feature is currently free.
                  </Box>
                }>
                <Help />
              </Tooltip>
            </Flex>
          </Cell>
          <Cell css={{ color: "$hiContrast" }}>Created at</Cell>
          <Cell>
            <RelativeTime
              id="cat"
              prefix="createdat"
              tm={stream.createdAt}
              swap={true}
            />
          </Cell>
          <Cell css={{ color: "$hiContrast" }}>Last seen</Cell>
          <Cell>
            <RelativeTime
              id="last"
              prefix="lastSeen"
              tm={stream.lastSeen}
              swap={true}
            />
          </Cell>
          <Cell css={{ color: "$hiContrast" }}>Status</Cell>
          <Cell>{stream.isActive ? "Active" : "Idle"}</Cell>
          <Cell css={{ color: "$hiContrast" }}>Suspended</Cell>
          <Cell>{stream.suspended ? "Suspended" : "Normal"}</Cell>
        </Box>
      </Flex>
    </>
  );
};

export default StreamDetailsBox;
