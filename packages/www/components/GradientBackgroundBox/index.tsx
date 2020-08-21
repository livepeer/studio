import { Box } from "@theme-ui/components";

const GradientBackgroundBox = ({
  children = null,
  sx = undefined,
  ...moreProps
}) => (
  <Box sx={{ position: "relative", overflow: "hidden", ...sx }} {...moreProps}>
    <div
      sx={{
        position: "absolute",
        width: "100%",
        overflow: "hidden",
        height: "100%",
        top: "-10vw",
        pointerEvents: "none",
        zIndex: -1,
      }}
    >
      <Box
        sx={{
          bg: "#BFA8FF",
          opacity: 0.25,
          filter: "blur(160px)",
          width: "30vw",
          height: "30vw",
          minWidth: "500px",
          minHeight: "500px",
          position: "absolute",
          left: "50%",
          top: "-5vw",
        }}
      />
      <Box
        sx={{
          bg: "#BFA8FF",
          opacity: 0.25,
          filter: "blur(160px)",
          width: "30vw",
          height: "30vw",
          minWidth: "500px",
          minHeight: "500px",
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
      <Box
        sx={{
          bg: "#BFA8FF",
          opacity: 0.25,
          filter: "blur(160px)",
          width: "30vw",
          height: "30vw",
          minWidth: "500px",
          minHeight: "500px",
          position: "absolute",
          right: "50%",
          top: "-5vw",
        }}
      />
    </div>
    {children}
  </Box>
);

export default GradientBackgroundBox;
