import moment from "moment";

import { Box, Badge, Status, Tooltip } from "@livepeer.com/design-system";
import { MultistreamTarget, Stream } from "@livepeer.com/api";

import { MultistreamStatus } from "hooks/use-analyzer";
import { useMemo } from "react";

enum TargetStatus {
  Idle = "Idle",
  Pending = "Pending",
  Offline = "Offline",
  Online = "Online",
}

type StatusBadgeStyle = {
  color: Parameters<typeof Badge>[0]["variant"];
  dotColor?: Parameters<typeof Status>[0]["variant"];
  noTooltip?: boolean;
};

const styleByStatus: Record<TargetStatus, StatusBadgeStyle> = {
  Idle: { color: "gray", noTooltip: true },
  Pending: { color: "lime", dotColor: "yellow" },
  Offline: { color: "red" },
  Online: { color: "green" },
};

const STALE_STATUS_TIMEOUT = 3 * 60 * 1000;

const computeStatus = (
  stream: Stream,
  target: MultistreamTarget,
  status: MultistreamStatus,
  activeSince: number,
  lastProbe: number
): TargetStatus => {
  console.log(
    "computing",
    target?.name,
    target?.id,
    "lastProbe=",
    new Date(lastProbe),
    "activeSince=",
    new Date(activeSince),
    "lastSeen=",
    new Date(stream?.lastSeen)
  );
  if (!activeSince || lastProbe < activeSince) {
    status = null;
  }
  const timeSinceSeen = Date.now() - (stream?.lastSeen ?? 0);
  const isLongInactive =
    !stream?.isActive && timeSinceSeen >= STALE_STATUS_TIMEOUT;
  if (isLongInactive) {
    return TargetStatus.Idle;
  }

  const isConnected = status?.connected.status;
  const isLateCreation = target?.createdAt > activeSince;
  const isConnecting = stream?.isActive && !target?.disabled && !isLateCreation;
  console.log(
    "part compute",
    target?.name,
    isConnected,
    isLateCreation,
    isConnecting
  );
  if (!isConnected && !isConnecting) {
    return TargetStatus.Idle;
  }

  if (isConnected === undefined) {
    return TargetStatus.Pending;
  }
  return isConnected ? TargetStatus.Online : TargetStatus.Offline;
};

const TargetStatusBadge = ({
  stream,
  activeSince,
  target,
  status: msStatus,
}: {
  stream: Stream;
  activeSince: number;
  target: MultistreamTarget;
  status: MultistreamStatus;
}) => {
  const lastProbe = useMemo(
    () => Date.parse(msStatus?.connected.lastProbeTime),
    [msStatus?.connected.lastProbeTime]
  );
  const status = useMemo(
    () => computeStatus(stream, target, msStatus, activeSince, lastProbe),
    [stream, target, msStatus, activeSince, lastProbe]
  );
  const style = styleByStatus[status];
  const badge = (
    <Badge size="2" variant={style.color}>
      <Box css={{ mr: 5 }}>
        <Status size="1" variant={style.dotColor ?? (style.color as any)} />
      </Box>
      {status}
    </Badge>
  );
  const timeAgo = useMemo(() => moment.unix(lastProbe / 1000), [lastProbe]);
  if (!timeAgo.isValid() || style.noTooltip) {
    return badge;
  }
  return <Tooltip content={timeAgo.fromNow()}>{badge}</Tooltip>;
};

export default TargetStatusBadge;
