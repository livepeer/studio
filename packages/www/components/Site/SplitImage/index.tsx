import { Text, Link as A, Box as LiveBox } from "@livepeer/design-system";
import { Container, Box } from "@theme-ui/components";

export const SplitImage = ({ direction }) => {
  return (
    <Container>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridAutoFlow: "dense",
          padding: "15px",
          gap: "20px",
        }}>
        <Box
          sx={{
            background: "#D4D4D4",
            color: "#000116",
            borderRadius: "12px",
          }}></Box>
        <Box
          sx={{
            background: "white",
            color: "#000116",
            borderRadius: "12px",
            paddingX: "32px",
            paddingY: "120px",
            gridColumn: direction ? 1 : 2,
            gridRow: 1,
          }}>
          <LiveBox
            css={{
              fontSize: 58,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: "-4px",
              mb: 32,
              "@bp1": {
                fontSize: 58,
              },
              "@bp2": {
                fontSize: 58,
              },
              "@bp3": {
                fontSize: 58,
              },
            }}>
            Video Simplified for Web3 Apps
          </LiveBox>
          <Box sx={{ color: "#000116" }}>
            New to building apps with video? Livepeer Studio makes it easy.
            Access the decentralized infrastructure of the Livepeer network, all
            the features you need for tooling, and pricing at a fraction of the
            prices of web2 solutions to accelerate app development and minimize
            maintenance.
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default SplitImage;
