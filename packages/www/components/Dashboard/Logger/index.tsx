import { Box, Heading, Flex, Badge } from "@livepeer.com/design-system";

const Log = ({ date, type, text }) => {
  return (
    <Flex align="center" css={{ p: "$4", fontSize: "$1", fontFamily: "$mono" }}>
      <Box css={{ color: "$mauve9" }}>{date}</Box>
      <Badge css={{ mx: "$4" }}>{type}</Badge>
      <Box css={{ color: "$mauve9" }}>{text}</Box>
    </Flex>
  );
};
const Logger = ({ ...props }) => {
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
      <Box css={{ bc: "$mauve3", height: 400, borderRadius: 6 }}>
        <Log date="8/30/2021, 3:13:40 PM" type="info" text="Stream started" />
      </Box>
    </Box>
  );
};

export default Logger;
