import { Flex, Text } from "@livepeer/design-system";
import Spinner from "components/Dashboard/Spinner";

const Progress = ({
  text,
  percentage,
}: {
  text: string;
  percentage?: number;
}) => (
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
        color: "$whiteA10",
        width: "$9",
        height: "$9",
      }}
    />
    {percentage !== undefined && (
      <Text size="2" css={{ color: "$whiteA12" }}>
        {text} {percentage}%
      </Text>
    )}
  </Flex>
);

export default Progress;
