import { Box } from "@livepeer/design-system";

const CutOut = ({ orientation = "right", backgroundColor = "transparent" }) => (
  <>
    <Box
      css={{
        bc: backgroundColor,
        position: "absolute",
        right: orientation === "right" ? 120 : "initial",
        left: orientation === "left" ? 120 : "initial",
        top: 1,
        borderTopRightRadius: "$3",
        borderTopLeftRadius: "$3",
        zIndex: -1,
        height: "100%",
        width: 120,
        transform: orientation === "right" ? "skew(35deg)" : "skew(-35deg)",
        "@bp2": {
          width: 80,
          right: orientation === "right" ? 165 : "initial",
          left: orientation === "left" ? 165 : "initial",
        },
      }}
    />
    <Box
      css={{
        bc: backgroundColor,
        position: "absolute",
        left: orientation === "right" ? 0 : "initial",
        right: orientation === "left" ? 0 : "initial",
        top: 1,
        width: "calc(100% - 190px)",
        borderTopRightRadius: "$4",
        borderTopLeftRadius: "$4",
        zIndex: -1,
        height: "100%",
      }}
    />
  </>
);

export default CutOut;
