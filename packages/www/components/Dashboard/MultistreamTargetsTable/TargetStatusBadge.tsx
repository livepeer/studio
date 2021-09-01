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

const computeStatus = (
  stream: Stream,
  target: MultistreamTarget,
  status: MultistreamStatus
): TargetStatus => {
  if (!stream?.isActive || (!status?.connected.status && target?.disabled)) {
    return TargetStatus.Idle;
  } else if (!status) {
    return TargetStatus.Pending;
  }
  const isConnected = status.connected.status;
  return isConnected ? TargetStatus.Online : TargetStatus.Offline;
};

const TargetStatusBadge = ({
  stream,
  target,
  status: msStatus,
}: {
  stream: Stream;
  target: MultistreamTarget;
  status: MultistreamStatus;
}) => {
  const status = useMemo(
    () => computeStatus(stream, target, msStatus),
    [stream, target, msStatus]
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
  const timeAgo = useMemo(() => {
    const lastProbe = Date.parse(msStatus?.connected.lastProbeTime);
    return moment.unix(lastProbe / 1000);
  }, [msStatus?.connected.lastProbeTime]);
  if (!timeAgo.isValid() || style.noTooltip) {
    return badge;
  }
  return <Tooltip content={timeAgo.fromNow()}>{badge}</Tooltip>;
};

export default TargetStatusBadge;
