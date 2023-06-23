import { useMemo } from "react";
import { Asset } from "livepeer";
import Progress from "./Progress";
import { Flex, Box, Tooltip } from "@livepeer/design-system";
import { QuestionMarkCircledIcon as Help } from "@radix-ui/react-icons";

const ProcessingProgress = ({ asset }: { asset?: Asset }) => {
  const percentage = useMemo(() => {
    const progress = asset?.status?.progress ?? 0;
    return Math.floor(progress * 100);
  }, [asset]);
  return (
    <Flex align="center">
      <Tooltip
        multiline
        content={
          <Box>
            Your video can now be played. In the background, it is converted
            into several quality levels so that it can be played smoothly by all
            viewers.
          </Box>
        }>
        <Help />
      </Tooltip>
    </Flex>
  );
};

export default ProcessingProgress;
