import { Badge, Box, Status } from "@livepeer/design-system";

const IdleStream = () => (
  <Box
    css={{
      width: "100%",
      height: 265,
      borderRadius: "$2",
      position: "relative",
      bc: "$panel",
      border: "1px solid $neutral6",
    }}>
    <Badge
      size="2"
      css={{
        backgroundColor: "$neutral7",
        position: "absolute",
        zIndex: 1,
        left: 10,
        top: 10,
        letterSpacing: 0,
      }}>
      <Box css={{ mr: 5 }}>
        <Status css={{ backgroundColor: "$neutral9" }} size="1" />
      </Box>
      Idle
    </Badge>
  </Box>
);

export default IdleStream;
