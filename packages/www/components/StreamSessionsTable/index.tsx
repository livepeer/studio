import { useEffect, useState } from "react";
import { useApi, usePageVisibility } from "../../hooks";
import { Box, Container, Flex } from "@theme-ui/components";
import { Table, TableRow, TableRowVariant } from "../Table";
import { RelativeTime } from "../CommonAdminTable";
import { pathJoin, breakablePath } from "../../lib/utils";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Copy from "../../public/img/copy.svg";

type RecordingURLProps = {
  id: string;
  status: string;
  recUrl: string;
};

export const RecordingURL = ({ id, status, recUrl }: RecordingURLProps) => {
  const [isCopied, setCopied] = useState(0);
  useEffect(() => {
    if (isCopied) {
      const interval = setTimeout(() => {
        setCopied(0);
      }, isCopied);
      return () => clearTimeout(interval);
    }
  }, [isCopied]);
  return (
    <Flex
      key={"recurl-" + id}
      sx={{
        justifyContent: "flex-start",
        alignItems: "center",
        wordBreak: "break-all",
      }}>
      {recUrl ? (
        <CopyToClipboard text={recUrl} onCopy={() => setCopied(2000)}>
          <Flex sx={{ alignItems: "center" }}>
            <a
              sx={{
                fontSize: 12,
                fontFamily: "monospace",
                mr: 1,
                wordBreak: "break-all",
              }}
              href={recUrl}
              target="_blank">
              {breakablePath(recUrl)}
            </a>
            <Copy
              sx={{
                mr: 1,
                cursor: "pointer",
                width: 14,
                height: 14,
                color: "offBlack",
              }}
            />
          </Flex>
        </CopyToClipboard>
      ) : (
        <Box>{status}</Box>
      )}
      {!!isCopied && <Box sx={{ fontSize: 12, color: "offBlack" }}>Copied</Box>}
    </Flex>
  );
};

const StreamSessionsTable = ({
  streamId,
  mt = null,
}: {
  streamId: string;
  mt?: string | number;
}) => {
  const [streamsSessions, setStreamsSessions] = useState([]);
  const { user, getStreamSessions } = useApi();
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
    <Box sx={{ mb: "0.5em", mt: "2em" }}>
      <h4 sx={{ mb: "0.5em" }}>Sessions</h4>
      <Table
        sx={{
          gridTemplateColumns: "auto auto",
        }}>
        <TableRow variant={TableRowVariant.Header}>
          <Box>Last Active</Box>
          <Box>Recording URL</Box>
        </TableRow>
        {streamsSessions.map((stream) => {
          const { id, lastSeen } = stream;
          return (
            <>
              {user.admin ? (
                <Box
                  sx={{
                    mt: "0.8em",
                    mb: -10,
                    gridColumn: "1/-1",
                    fontSize: [8, 10],
                  }}>
                  <a
                    target="_blank"
                    href={`https://papertrailapp.com/groups/16613582/events?q=${stream.id}`}
                    sx={{ userSelect: "all" }}>
                    Papertrail link {stream.id}
                  </a>
                </Box>
              ) : null}
              <TableRow key={id} selectable={false} textSelectable={true}>
                <RelativeTime
                  id={id}
                  prefix="lastSeen"
                  tm={lastSeen}
                  swap={true}
                />
                <RecordingURL
                  id={stream.id}
                  recUrl={stream.recordingUrl}
                  status={stream.recordingStatus}
                />
              </TableRow>
            </>
          );
        })}
      </Table>
    </Box>
  ) : null;
};

export default StreamSessionsTable;
