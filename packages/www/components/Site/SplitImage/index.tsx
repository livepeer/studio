import { Box as LiveBox } from "@livepeer/design-system";
import { Container, Box } from "@theme-ui/components";
import Image from "next/image";

export default function SplitImage({
  inverted,
  title,
  richText,
  defaultImage,
}) {
  const { image } = defaultImage;
  console.log(defaultImage.asset.url);
  return (
    <Container>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridAutoFlow: "dense",
          padding: "15px",
          gap: "20px",
          maxWidth: "1600px",
          marginLeft: "auto",
          marginRight: "auto",
        }}>
        <Box
          sx={{
            background: "#D4D4D4",
            color: "#000116",
            borderRadius: "12px",
          }}>
          <img
            src={defaultImage.asset.url}
            alt={title}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        </Box>
        <Box
          sx={{
            background: "white",
            color: "#000116",
            borderRadius: "12px",
            paddingX: "32px",
            paddingY: "32px",
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
