import { Box } from "@theme-ui/components";

const GradientBackgroundBox = ({
  children = null,
  sx = undefined,
  withoutGradient = false,
  ...moreProps
}) => (
  <Box sx={{ position: "relative", overflow: "hidden", ...sx }} {...moreProps}>
    {!withoutGradient && (
      <div
        sx={{
          position: "absolute",
          width: "100%",
          overflow: "hidden",
          height: "100%",
          top: "-10vw",
          pointerEvents: "none",
          zIndex: -1
        }}
      >
        <Box
          sx={{
            bg: "#F5B9FF",
            opacity: 0.5,
            filter: "blur(160px)",
            width: "30vw",
            height: "30vw",
            minWidth: "500px",
            minHeight: "500px",
            position: "absolute",
            right: "75%",
            top: "-5vw"
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
            transform: "translateX(-50%)"
          }}
        />
        <Box
          sx={{
            bg: "#B0B0FF",
            opacity: 0.25,
            filter: "blur(160px)",
            width: "30vw",
            height: "30vw",
            minWidth: "500px",
            minHeight: "500px",
            position: "absolute",
            left: "75%",
            top: "-5vw"
          }}
        />
      </div>
    )}
    {children}
  </Box>
);

export default GradientBackgroundBox;
