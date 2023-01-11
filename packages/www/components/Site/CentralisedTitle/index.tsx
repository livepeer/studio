import React from "react";
import { PortableText } from "@portabletext/react";
import { Container, Box } from "@theme-ui/components";
import { Text, Box as LiveBox } from "@livepeer/design-system";
import Image from "next/image";
import { urlFor } from "../../../lib/client";

const CentralisedHero = ({ title, portableText, image }) => {
  return (
    <Container
      sx={{
        paddingX: "15px",
      }}>
      <Box
        sx={{
          padding: "15px",
          background: "var(--colors-hiContrast)",
          maxWidth: "1600px",
          marginLeft: "auto",
          marginRight: "auto",
          borderRadius: "0 12px 12px 12px",
        }}>
        <Box
          sx={{
            height: ["400px", "400px", "600px", "600px", "800px"],
            borderRadius: "12px",
            overflow: "hidden",
            position: "relative",
          }}>
          <Box
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              margin: "auto",
              zIndex: 1,
              display: "grid",
              placeItems: "center",
              alignContent: "center",
              gap: 0,
              color: "var(--colors-loContrast)",
            }}>
            <LiveBox
              css={{
                fontSize: 40,
                fontWeight: 600,
                lineHeight: 0.8,
                letterSpacing: "-2px",
                maxWidth: "1200px",
                textAlign: "center",
                mb: "32px",
                "@bp1": {
                  fontSize: 60,
                },
                "@bp2": {
                  fontSize: 66,
                },
                "@bp3": {
                  fontSize: 72,
                },
              }}>
              {title}
            </LiveBox>
            <Box sx={{ fontSize: "28px" }}>
              {portableText && <PortableText value={portableText} />}
            </Box>
          </Box>
          <Image
            src={urlFor(image).url()}
            placeholder="blur"
            blurDataURL={urlFor(image).width(24).height(24).blur(10).url()}
            alt={title}
            sizes="100vw"
            fill
            style={{ objectFit: "cover" }}
          />
        </Box>
      </Box>
    </Container>
  );
};
export default CentralisedHero;
