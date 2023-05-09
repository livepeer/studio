import { Box, Badge, Status } from "@livepeer/design-system";

const FailedProcessing = () => (
  <Box
    css={{
      width: "100%",
      height: 265,
      borderRadius: "$2",
      overflow: "hidden",
      position: "relative",
      bc: "#28282c",
    }}>
    <Badge
      size="2"
      variant="red"
      css={{
        position: "absolute",
        zIndex: 1,
        left: 10,
        top: 10,
        letterSpacing: 0,
      }}>
      <Box css={{ mr: 5 }}>
        <Status variant="red" size="1" />
      </Box>
      Failed
    </Badge>
  </Box>
);

export default FailedProcessing;
