import { Box as LiveBox } from "@livepeer/design-system";
import { Container, Box } from "@theme-ui/components";

export default function SplitImage({ inverted, title, richText }) {
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
            gridColumn: inverted ? 1 : 2,
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
            {title}
          </LiveBox>
          <Box sx={{ color: "#000116" }}>{richText}</Box>
        </Box>
      </Box>
    </Container>
  );
}
