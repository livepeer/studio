import { useMemo } from "react";
import { Asset } from "livepeer";
import Progress from "./Progress";

const ProcessingProgress = ({ asset }: { asset?: Asset }) => {
  const percentage = useMemo(() => {
    const progress = asset?.status?.progress ?? 0;
    return Math.floor(progress * 100);
  }, [asset]);
  return <Progress text="Processing" percentage={percentage} />;
};

export default ProcessingProgress;
