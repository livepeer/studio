import { keyframes, Box } from "@livepeer.com/design-system";

const rotate = keyframes({
  "100%": { transform: "rotate(360deg)" },
});

const Index = ({ css = {}, speed = "1s" }) => (
  <Box
    css={{
      color: "$violet9",
      border: "3px solid",
      borderColor: "$loContrast",
      borderRadius: "50%",
      borderTopColor: "inherit",
      width: 26,
      height: 26,
      maxWidth: 26,
      maxHeight: 26,
      animation: `${rotate} ${speed} linear`,
      animationIterationCount: "infinite",
      ...css,
    }}
  />
);

export default Index;
