import { Box as LiveBox } from "@livepeer/design-system";
import { PortableText } from "@portabletext/react";
import { Container, Box } from "@theme-ui/components";
import Image from "next/image";

export default function SplitImage({
  inverted,
  title,
  richText,
  defaultImage,
  portableTextRaw,
}) {
  const { image } = defaultImage;
  console.log("split image", defaultImage.asset.url, portableTextRaw);
  return (
    <Container>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: ["1fr", "1fr 1fr"],
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
            overflow: "hidden",
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
            gridColumn: inverted ? ["unset", 1] : ["unset", 2],
            gridRow: 1,
          }}>
          <LiveBox
            css={{
              fontSize: 32,
              fontWeight: 600,
              lineHeight: 1,
              mb: 32,
              letterSpacing: "0px",
              "@bp1": {
                fontSize: 40,
                letterSpacing: "-1px",
              },
              "@bp2": {
                fontSize: 50,
                letterSpacing: "-2px",
              },
              "@bp3": {
                fontSize: 58,
                letterSpacing: "-4px",
              },
            }}>
            {title}
          </LiveBox>
          <Box sx={{ color: "#000116" }}>{richText}</Box>
          {portableTextRaw && <PortableText value={portableTextRaw} />}
        </Box>
      </Box>
    </Container>
  );
}
