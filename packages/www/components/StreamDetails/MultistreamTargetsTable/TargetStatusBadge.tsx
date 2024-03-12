import { MultistreamTarget, Stream } from "@livepeer.studio/api";

import { Metrics, MultistreamStatus } from "hooks/use-analyzer";
import { useMemo } from "react";
import StatusBadge, { Variant as Status } from "../../StatusBadge";
import moment from "moment";

const computeStatus = (
  stream: Stream,
  target: MultistreamTarget,
  status: MultistreamStatus,
  streamActiveSince: number | undefined,
  metrics: Metrics
): Status => {
  if (
    status?.connected.lastProbeTime < streamActiveSince ||
    !streamActiveSince
  ) {
    status = null;
  }

  const currentTimestamp = moment().unix() * 1000;

  const lastActive = metrics?.MultistreamActiveSec?.find(
    (m) => m?.dimensions?.targetId === target?.id
  )?.last[0];

  const difference = (currentTimestamp - lastActive) / 1000;

  const TIME_THRESHOLD = 30;

  const isConnected = difference < TIME_THRESHOLD;

  if (
    !stream?.isActive ||
    target?.createdAt > streamActiveSince ||
    (target?.disabled && !isConnected)
  ) {
    return Status.Idle;
  } else if (difference > TIME_THRESHOLD) {
    return Status.Pending;
  }
  return isConnected ? Status.Online : Status.Offline;
};

const TargetStatusBadge = ({
  stream,
  target,
  status: msStatus,
  metrics,
  streamActiveSince,
}: {
  stream: Stream;
  target: MultistreamTarget;
  status: MultistreamStatus;
  metrics: Metrics;
  streamActiveSince: number | undefined;
}) => {
  const status = useMemo(
    () => computeStatus(stream, target, msStatus, streamActiveSince, metrics),
    [stream, target, msStatus, streamActiveSince]
  );
  const timestamp = msStatus?.connected.lastProbeTime;
  return <StatusBadge variant={status} timestamp={timestamp} />;
};

export default TargetStatusBadge;
