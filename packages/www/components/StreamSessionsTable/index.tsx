import { useEffect, useState } from "react";
import { useApi, usePageVisibility } from "../../hooks";
import { Box, Container, Flex } from "@theme-ui/components";
import { Table, TableRow, TableRowVariant } from "../Table";
import { Stream } from "@livepeer.com/api";
import { RelativeTime, RenditionsDetails } from "../StreamsTable";
import { pathJoin, breakablePath } from "../../lib/utils";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Copy from "../../public/img/copy.svg";

type RecordingURLProps = {
  manifestId: string;
  baseUrl: string;
  hasRecording: boolean;
};

export const RecordingURL = ({
  manifestId,
  baseUrl,
  hasRecording
}: RecordingURLProps) => {
  const [isCopied, setCopied] = useState(0);
  useEffect(() => {
    if (isCopied) {
      const interval = setTimeout(() => {
        setCopied(0);
      }, isCopied);
      return () => clearTimeout(interval);
    }
  }, [isCopied]);
  const fullUrl = hasRecording
    ? pathJoin(baseUrl, "recordings", manifestId, "index.m3u8")
    : "";
  const anchor = true;
  return (
    <Flex
      key={"recurl-" + manifestId}
      sx={{
        justifyContent: "flex-start",
        alignItems: "center",
        wordBreak: "break-all"
      }}
    >
      {fullUrl ? (
        <CopyToClipboard text={fullUrl} onCopy={() => setCopied(2000)}>
          <Flex sx={{ alignItems: "center" }}>
            {anchor ? (
              <a
                sx={{
                  fontSize: 12,
                  fontFamily: "monospace",
                  mr: 1,
                  wordBreak: "break-all"
                }}
                href={fullUrl}
                target="_blank"
              >
                {breakablePath(fullUrl)}
              </a>
            ) : (
              <span sx={{ fontSize: 12, fontFamily: "monospace", mr: 1 }}>
                {fullUrl}
              </span>
            )}
            <Copy
              sx={{
                mr: 1,
                cursor: "pointer",
                width: 14,
                height: 14,
                color: "listText"
              }}
            />
          </Flex>
        </CopyToClipboard>
      ) : null}
      {!!isCopied && <Box sx={{ fontSize: 12, color: "listText" }}>Copied</Box>}
    </Flex>
  );
};

export default ({
  streamId,
  mt = null
}: {
  streamId: string;
  mt?: string | number;
}) => {
  const [streamsSessions, setStreamsSessions] = useState([]);
  const [baseUrl, setBaseUrl] = useState(null);
  const { getStreamSessions, getIngest } = useApi();
  useEffect(() => {
    getIngest()
      .then((ingest) => {
        if (ingest && ingest.length) {
          setBaseUrl(ingest[0].base);
        }
      })
      .catch((err) => console.error(err)); // todo: surface this
  }, [streamId]);
  useEffect(() => {
    getStreamSessions(streamId)
      .then((streams) => setStreamsSessions(streams))
      .catch((err) => console.error(err)); // todo: surface this
  }, [streamId]);
  const isVisible = usePageVisibility();
  useEffect(() => {
    if (!isVisible) {
      return;
    }
    const interval = setInterval(() => {
      getStreamSessions(streamId)
        .then((streams) => setStreamsSessions(streams))
        .catch((err) => console.error(err)); // todo: surface this
    }, 5000);
    return () => clearInterval(interval);
  }, [streamId, isVisible]);

  return streamsSessions.length ? (
    <Container sx={{ mb: 5, mt: 2 }}>
      <h4 sx={{ mb: "0.5em" }}>Sessions</h4>
      <Table sx={{ gridTemplateColumns: "auto auto auto " }}>
        <TableRow variant={TableRowVariant.Header}>
          <Box>Created</Box>
          <Box>Last Active</Box>
          <Box>Recording URL</Box>
        </TableRow>
        {streamsSessions.map((stream) => {
          const {
            id,
            lastSeen,
            createdAt,
            sourceSegments,
            transcodedSegments
          } = stream;
          return (
            <TableRow key={id}>
              <RelativeTime
                id={id}
                prefix="createdat"
                tm={createdAt}
                swap={true}
              />
              <RelativeTime
                id={id}
                prefix="lastSeen"
                tm={lastSeen}
                swap={true}
              />
              <RecordingURL
                manifestId={stream.id}
                hasRecording={!!stream.recordObjectStoreId}
                baseUrl={baseUrl}
              />
            </TableRow>
          );
        })}
      </Table>
    </Container>
  ) : null;
};
