import { MultistreamTarget, Stream } from "@livepeer.com/api";

import { MultistreamStatus } from "hooks/use-analyzer";
import { useMemo } from "react";
import StatusBadge, { Variant as Status } from "../StatusBadge";

const computeStatus = (
  stream: Stream,
  target: MultistreamTarget,
  status: MultistreamStatus
): Status => {
  if (!stream?.isActive || (!status?.connected.status && target?.disabled)) {
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
}: {
  stream: Stream;
  target: MultistreamTarget;
  status: MultistreamStatus;
}) => {
  const status = useMemo(
    () => computeStatus(stream, target, msStatus),
    [stream, target, msStatus]
  );
  const timestamp = msStatus?.connected.lastProbeTime;
  return <StatusBadge variant={status} timestamp={timestamp} />;
};

export default TargetStatusBadge;
