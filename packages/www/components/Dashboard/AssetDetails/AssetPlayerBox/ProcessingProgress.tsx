import { Box, Badge, Status } from "@livepeer/design-system";

const ProcessingProgress = () => (
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
      css={{
        backgroundColor: "$primary7",
        position: "absolute",
        zIndex: 1,
        left: 10,
        top: 10,
        letterSpacing: 0,
      }}>
      <Box css={{ mr: 5 }}>
        <Status css={{ backgroundColor: "$primary9" }} size="1" />
      </Box>
      Processing
    </Badge>
  </Box>
);

export default ProcessingProgress;
