import { useAnalyzer, useApi } from "hooks";
import { useEffect, useState } from "react";

import { Stream } from "@livepeer.com/api";
import { Box, Heading, Flex, Badge } from "@livepeer.com/design-system";
import { events } from "hooks/use-analyzer";

const maxLogs = 8192;
const pastLogsLookback = 5 * 60 * 1000; // 5 minutes

type LogData = {
  key: string;
  timestamp: number;
  level: "info" | "error";
  text: string;
};

const Log = ({ timestamp, level, text }: LogData) => {
  const dateStr = new Date(timestamp).toLocaleString();
  return (
    <Flex align="center" css={{ p: "$4", fontSize: "$1", fontFamily: "$mono" }}>
      <Box css={{ color: "$mauve9" }}>{dateStr}</Box>
      <Badge css={{ mx: "$4" }}>{level}</Badge>
      <Box css={{ color: "$mauve9" }}>{text}</Box>
    </Flex>
  );
};

const lpHostedOrchUri = /https?:\/\/(.+)\.livepeer\.(com|monster):(80|443)/;

function orchestratorName({
  orchestrator: { address, transcodeUri },
}: events.TranscodeAttemptInfo) {
  const matches = lpHostedOrchUri.exec(transcodeUri);
  return !matches?.length ? address : matches[1];
}

function handleEvent(evt: events.Any, userIsAdmin: boolean): LogData[] {
  switch (evt.type) {
    case "transcode":
      if (evt.success && !userIsAdmin) {
        // non-admin users should only see fatal errors.
        return [];
      }
      return evt.attempts
        .filter((a) => a.error)
        .map((a) => ({
          key: evt.id,
          timestamp: evt.timestamp,
          level: "error",
          text: `Transcode error from ${orchestratorName(a)} for segment ${
            evt.segment.seqNo
          }: ${a.error}`,
        }));
    case "webhook_event":
      if (!evt.event.startsWith("multistream.")) {
        console.error("unknown event:", evt.event);
        break;
      }
      const payload = evt.payload as events.MultistreamWebhookPayload;
      const action = evt.event.substring("multistream.".length);
      const level = action === "error" ? "error" : "info";
      return [
        {
          key: evt.id,
          timestamp: evt.timestamp,
          level,
          text: `Multistream of "${payload.target.profile}" to target "${payload.target.name}" ${action}!`,
        },
      ];
  }
  return [];
}

const Logger = ({ stream, ...props }: { stream: Stream }) => {
  const { getEvents } = useAnalyzer();

  const { user } = useApi();
  const userIsAdmin = user && user.admin;

  const [logs, setLogs] = useState<LogData[]>([]);
  const addLogs = (newLogs: LogData[]) =>
    setLogs((currLogs) => {
      let logs = [...currLogs, ...newLogs];
      if (logs.length > maxLogs) {
        logs = logs.slice(logs.length - maxLogs);
      }
      return logs;
    });

  useEffect(() => {
    setLogs([]);
    if (!stream?.region) return;

    const handler = (evt: events.Any) => addLogs(handleEvent(evt, userIsAdmin));
    const from = Date.now() - pastLogsLookback;
    return getEvents(stream.region, stream.id, handler, from);
  }, [stream?.region, stream?.id]);

  return (
    <Box {...props}>
      <Box
        css={{
          borderBottom: "1px solid",
          borderColor: "$mauve6",
          pb: "$1",
          mb: "$4",
          width: "100%",
        }}>
        <Heading size="1" css={{ fontWeight: 500, mb: "$1" }}>
          Logs
        </Heading>
      </Box>
      <Box css={{ bc: "$mauve3", height: 300, borderRadius: 6 }}>
        {!logs.length ? (
          <Box css={{ p: "$4", fontSize: "$1", fontFamily: "$mono" }}>
            Waiting for events...
          </Box>
        ) : (
          logs.map((log) => <Log {...log} />)
        )}
      </Box>
    </Box>
  );
};

export default Logger;
