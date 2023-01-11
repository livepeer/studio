import React from "react";
import { Container, Box } from "@theme-ui/components";
import { Text, Box as LiveBox } from "@livepeer/design-system";
import { urlFor } from "lib/client";
import Image from "next/image";

const SocialProof = ({ icons, title }) => {
  return (
    <Container
      sx={{
        pt: "64px",
      }}>
      <Box
        sx={{
          padding: "15px",
          textAlign: "center",
          maxWidth: "1600px",
          marginLeft: "auto",
          marginRight: "auto",
        }}>
        <LiveBox
          css={{
            fontSize: 40,
            fontWeight: 600,
            lineHeight: 0.8,
            letterSpacing: "-2px",
            mb: "8px",
            "@bp3": {
              fontSize: 48,
            },
          }}>
          {title}
        </LiveBox>
        <Box
          sx={{
            display: ["block", "flex"],
            flexWrap: "wrap",
            justifyContent: ["unset", "center"],
            width: "100%",
            paddingY: "64px",
            paddingX: "32px",
            columnGap: "32px",
          }}>
          {icons &&
            Array.isArray(icons) &&
            icons.map((icon) => (
              <Box key={icon._key} sx={{ padding: "1em" }}>
                <Image
                  alt={icon.alt}
                  src={urlFor(icon.asset).url()}
                  placeholder="blur"
                  blurDataURL={urlFor(icon.asset)
                    .width(24)
                    .height(24)
                    .blur(10)
                    .url()}
                  width={200}
                  height={100}
                  style={{ objectFit: "contain" }}
                />
              </Box>
            ))}
        </Box>
      </Box>
    </Container>
  );
};
export default SocialProof;
