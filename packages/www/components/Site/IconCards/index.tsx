import React from "react";
import { Container, Box } from "@theme-ui/components";
import { Text, Box as LiveBox } from "@livepeer/design-system";
import Image from "next/image";
import { urlFor } from "lib/client";

const IconCards = ({ title, cards }) => {
  return (
    <Container
      sx={{
        padding: "15px",
        marginLeft: "auto",
        marginRight: "auto",
      }}>
      <Box
        sx={{
          padding: "15px",
          pt: "64px",
          textAlign: "center",
          marginLeft: "auto",
          marginRight: "auto",
          background: "#ECEDEE",
          borderRadius: "12px",
          color: "#000000",
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

        <Box sx={{ fontSize: "28px", maxWidth: "600px", mx: "auto" }}>
          Livepeer Studio is an easy-to-use video toolkit for building apps with
          video.
        </Box>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            marginTop: "64px",
            textAlign: "left",
            justifyContent: ["unset", "center"],
            mx: "auto",
            maxWidth: "1600px",
          }}>
          {cards.map((card) => {
            return (
              <Box
                sx={{
                  border: "1px solid #00000026",
                  borderRadius: "12px",
                  padding: "16px",
                  boxSizing: "border-box",
                  maxWidth: ["100%", "240px", "240px", "calc(100%/5 - 13px)"],
                }}>
                <Box sx={{ pt: "64px" }}>
                  <Image
                    src={urlFor(card.image).url()}
                    placeholder="blur"
                    blurDataURL={urlFor(card.image)
                      .width(24)
                      .height(24)
                      .blur(10)
                      .url()}
                    alt={title}
                    width={48}
                    height={48}
                  />
                  <p>
                    Livepeer Studio is an easy-to-use video toolkit for building
                    apps with video.
                  </p>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Container>
  );
};
export default IconCards;
