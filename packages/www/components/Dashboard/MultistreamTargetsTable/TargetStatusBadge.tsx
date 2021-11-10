import { MultistreamTarget, Stream } from "@livepeer.com/api";

import { MultistreamStatus } from "hooks/use-analyzer";
import { useMemo } from "react";
import StatusBadge, { Variant as Status } from "../StatusBadge";

const computeStatus = (
  stream: Stream,
  target: MultistreamTarget,
  status: MultistreamStatus,
  streamActiveSince: number | undefined
): Status => {
  if (
    !stream?.isActive ||
    status?.connected.lastProbeTime < streamActiveSince ||
    target.createdAt > streamActiveSince
  ) {
    return Status.Idle;
  } else if (!status) {
    return Status.Pending;
  }
  const isConnected = status.connected.status;
  return isConnected ? Status.Online : Status.Offline;
};

const TargetStatusBadge = ({
  stream,
  target,
  status: msStatus,
  streamActiveSince,
}: {
  stream: Stream;
  target: MultistreamTarget;
  status: MultistreamStatus;
  streamActiveSince: number | undefined;
}) => {
  const status = useMemo(
    () => computeStatus(stream, target, msStatus, streamActiveSince),
    [stream, target, msStatus]
  );
  const timestamp = msStatus?.connected.lastProbeTime;
  return <StatusBadge variant={status} timestamp={timestamp} />;
};

export default TargetStatusBadge;
