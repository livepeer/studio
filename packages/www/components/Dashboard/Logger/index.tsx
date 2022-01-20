import { useAnalyzer, useApi } from "hooks";
import { useCallback, useEffect, useRef, useState } from "react";

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

const newLog = (
  evt: events.Any,
  level: "info" | "error",
  text: string,
  keySuffix?: string
): LogData => ({
  key: keySuffix ? `${evt.id}-${keySuffix}` : evt.id,
  timestamp: evt.timestamp,
  level,
  text,
});

const infoLog = (evt: events.Any, text: string, key?: string) =>
  newLog(evt, "info", text, key);

const errorLog = (evt: events.Any, text: string, key?: string) =>
  newLog(evt, "error", text, key);

const levelColorMap = {
  info: "violet",
  error: "red",
};

const Log = ({ timestamp, level, text }: LogData) => {
  const dateStr = new Date(timestamp).toLocaleString();
  return (
    <Flex
      align="center"
      css={{ mb: "$3", fontSize: "$1", fontFamily: "$mono" }}>
      <Badge css={{ mr: "$4" }} variant={levelColorMap[level] as any}>
        {level}
      </Badge>
      <Box css={{ color: "$mauve9", maxWidth: 100, mr: "$4" }}>{dateStr}</Box>
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

function createEventHandler() {
  const lastOrchestrator = useRef<string>();
  const failedSegments = useRef(new Set<number>());

  return useCallback(
    function handleEvent(evt: events.Any, userIsAdmin: boolean): LogData[] {
      switch (evt.type) {
        case "stream_state":
          const state = evt.state.active ? "active" : "inactive";
          const region = evt.region || "unknown";
          return [infoLog(evt, `Stream is ${state} in region "${region}"`)];
        case "transcode":
          const logs: LogData[] = [];
          const seqNo = evt.segment.seqNo;

          // non-admin users should only see fatal errors.
          if (!evt.success || userIsAdmin) {
            const errLogs = evt.attempts
              .filter((a) => a.error)
              .map((a, idx) => {
                const orch = orchestratorName(a);
                const msg = `Transcode error from ${orch} for segment ${seqNo}: ${a.error}`;
                return errorLog(evt, msg, `error-${idx}`);
              });
            if (errLogs.length > 0) {
              failedSegments.current.add(seqNo);
            }
            logs.push(...errLogs);
          }

          const lastAttempt = evt.attempts?.length
            ? evt.attempts[evt.attempts.length - 1]
            : null;
          const orchestrator = orchestratorName(lastAttempt);
          if (evt.success && orchestrator !== lastOrchestrator.current) {
            lastOrchestrator.current = orchestrator;
            logs.push(
              infoLog(
                evt,
                `Stream is being transcoded by orchestrator ${orchestrator}`,
                "transcoding-orchestrator"
              )
            );
          }

          if (evt.success && failedSegments.current.has(seqNo)) {
            logs.push(
              infoLog(
                evt,
                `Segment ${seqNo} successfully transcoded on ${orchestrator}`,
                "segment-success"
              )
            );
            failedSegments.current.delete(seqNo);
          }

          return logs;
        case "webhook_event":
          if (!evt.event.startsWith("multistream.")) {
            console.error("unknown event:", evt.event);
            break;
          }
          const payload = evt.payload as events.MultistreamWebhookPayload;
          const action = evt.event.substring("multistream.".length);
          const level = action === "error" ? "error" : "info";
          return [
            newLog(
              evt,
              level,
              `Multistream of "${payload.target.profile}" to target "${payload.target.name}" ${action}!`
            ),
          ];
      }
      return [];
    },
    [lastOrchestrator, failedSegments]
  );
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

  const handleEvent = createEventHandler();
  useEffect(() => {
    setLogs([]);
    if (!stream?.region) return;

    const handler = (evt: events.Any) => addLogs(handleEvent(evt, userIsAdmin));
    const from = Date.now() - pastLogsLookback;
    return getEvents(stream.region, stream.id, handler, from);
  }, [stream?.region, stream?.id, handleEvent]);

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
      <Box
        css={{
          overflow: "scroll",
          p: "$4",
          bc: "$mauve3",
          height: 300,
          borderRadius: 6,
        }}>
        {!logs.length ? (
          <Box css={{ fontSize: "$1", fontFamily: "$mono" }}>
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
