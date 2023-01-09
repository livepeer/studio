import React from "react";
import { Container, Box } from "@theme-ui/components";
import { Box as LiveBox } from "@livepeer/design-system";
import Image from "next/image";
import Button from "../../../components/Site/Button";
import Link from "next/link";

function idealTextColor(bgColor) {
  var nThreshold = 105;
  var components = getRGBComponents(bgColor);
  var bgDelta =
    components.R * 0.299 + components.G * 0.587 + components.B * 0.114;

  return 255 - bgDelta < nThreshold ? "#000000" : "#ffffff";
}

function getRGBComponents(color) {
  var r = color.substring(1, 3);
  var g = color.substring(3, 5);
  var b = color.substring(5, 7);

  return {
    R: parseInt(r, 16),
    G: parseInt(g, 16),
    B: parseInt(b, 16),
  };
}

function CustomLinkResolver({ button }) {
  const { url } = button;

  return (
    <Link
      style={{ textDecoration: "none" }}
      href={url.external ?? url?.internal?.slug?.current ?? "/"}
      target={url.blank ? "_blank" : "_self"}
      passHref>
      <Box
        as="a"
        sx={{
          background: "#fff",
          borderRadius: "10px",
          py: "16px",
          px: "32px",
          display: "block",
          textAlign: "center",
          color: "#000",
          border: "1px solid rgba(0,0,0,0.2)",
        }}>
        {button.buttonText}
      </Box>
    </Link>
  );
}

const PricingCards = ({ title, pricingCards }) => {
  return (
    <Container
      sx={{
        paddingX: "15px",
        py: "64px",
      }}>
      <Box
        sx={{
          maxWidth: "1600px",
          marginLeft: "auto",
          marginRight: "auto",
          display: "flex",
        }}>
        <Box
          sx={{
            background: "#0001AE",
            borderTopRightRadius: "12px",
            borderTopLeftRadius: "12px",
            marginRight: "auto",
            fontSize: "18px",
            py: "15px",
            px: "64px",
          }}>
          {title}
        </Box>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: [
            "1fr",
            "repeat(2,1fr)",
            "repeat(2,1fr)",
            "repeat(4,1fr)",
          ],
          background: "#0001AE",
          mx: "auto",
          maxWidth: "1600px",
          padding: "15px",
          gap: "20px",
        }}>
        {pricingCards.map((card, index) => {
          const { color, title, description, price, features, button } = card;
          return (
            <Box
              sx={{
                width: "100%",
                padding: "15px",
                background: color,
                color: idealTextColor(color),
                maxWidth: "1600px",
                marginLeft: "auto",
                marginRight: "auto",
                display: "grid",
                gap: "20px",
                borderRadius: "12px",
                gridTemplateRows: "auto 1fr auto auto auto",
              }}
              key={index + title}>
              <LiveBox
                css={{
                  fontSize: 40,
                  fontWeight: 600,
                  lineHeight: 0.8,
                  letterSpacing: "-2px",
                  maxWidth: "1200px",
                  textAlign: "center",
                  mt: "32px",
                  "@bp1": {
                    fontSize: 40,
                  },
                  "@bp2": {
                    fontSize: 44,
                  },
                  "@bp3": {
                    fontSize: 48,
                  },
                }}>
                {title}
              </LiveBox>
              <Box sx={{ textAlign: "center" }}>{description}</Box>
              {price ? (
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      justifyContent: "center",
                    }}>
                    <Box sx={{ mb: "16px" }}>$</Box>
                    <LiveBox
                      css={{
                        fontSize: 40,
                        fontWeight: 600,
                        lineHeight: 0.8,
                        letterSpacing: "-2px",
                        maxWidth: "1200px",
                        textAlign: "center",
                        mb: "16px",
                        mt: "32px",
                        "@bp3": {
                          fontSize: 60,
                        },
                      }}>
                      {price}
                    </LiveBox>
                  </Box>
                  <Box sx={{ textAlign: "center" }}>USD / month</Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    justifyContent: "center",
                  }}>
                  <Image
                    src="/pricing/group.png"
                    alt="Group of users"
                    width={90}
                    height={90}
                  />
                </Box>
              )}
              <CustomLinkResolver button={button} key={title} />
              <Box
                sx={{
                  textAlign: "center",
                  fontWeight: 600,
                  fontSize: "18px",
                  mt: "32px",
                }}>
                Plan includes
              </Box>
              <Box sx={{ display: "grid", gap: "8px" }}>
                {features.map((feature, index) => {
                  return (
                    <Box
                      key={index + feature}
                      sx={{ textAlign: "center", margin: 0, padding: 0 }}>
                      {feature}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Container>
  );
};
export default PricingCards;
