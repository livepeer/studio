/** @jsx jsx */
import { jsx } from "theme-ui";
import { keyframes } from "@emotion/core";
import { Box } from "@theme-ui/components";

const rotate = keyframes`
  100% {
    transform: rotate(360deg);
  }
`;

interface Props {
  loading?: boolean;
}

const Index = ({ loading, ...props }: Props) => (
  <Box
    {...props}
    sx={{
      border: "3px solid",
      borderColor: "surface",
      borderRadius: "50%",
      borderTopColor: "primary",
      width: 26,
      height: 26,
      animation: `${rotate} 1s linear`,
      animationIterationCount: "infinite",
    }}
  />
);

export default Index;
