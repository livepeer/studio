import { Flex, Text } from "@livepeer/design-system";
import { useMemo } from "react";
import Spinner from "components/Dashboard/Spinner";
import { Asset } from "@livepeer.studio/api";

const ProcessingProgress = ({ asset }: { asset?: Asset }) => {
  const percentage = useMemo(() => {
    const progress = asset?.status?.progress ?? 0;
    return Math.floor(progress * 100);
  }, [asset]);

  return (
    <Flex
      direction="column"
      gap={1}
      align="center"
      justify="center"
      css={{
        width: "100%",
        height: 265,
        borderRadius: "$2",
        overflow: "hidden",
        bc: "#28282c",
      }}>
      <Spinner
        css={{
          color: "$loContrast",
          width: "$9",
          height: "$9",
        }}
      />
      <Text size="2" css={{ color: "$loContrast" }}>
        Processing {percentage}%
      </Text>
    </Flex>
  );
};

export default ProcessingProgress;
