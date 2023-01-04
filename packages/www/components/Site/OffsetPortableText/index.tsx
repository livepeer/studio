import { Text, Link as A, Box as LiveBox } from "@livepeer/design-system";
import { Container, Box } from "@theme-ui/components";
import Button from "../../../components/Site/Button";
import { PortableText } from "@portabletext/react";
import Link from "next/link";

function CustomLinkResolver({ button }) {
  const { url } = button;

  return (
    <Link
      style={{ textDecoration: "none" }}
      href={url.external ?? url.internal.slug.current ?? "/"}
      target={url.blank ? "_blank" : "_self"}
      passHref>
      <Button
        small
        variant="blue"
        css={{
          bc: "#0A5CD8",
          fontSize: 20,
          fontWeight: 500,
          borderRadius: "$1",
          px: "6px",
          py: 0,
          mt: 16,
          textDecoration: "none",
          "&:hover": {
            textDecoration: "none",
          },
          "@bp2": {
            fontSize: 34,
            px: "4px",
            py: "2px",
          },
        }}>
        {button.buttonText}
      </Button>
    </Link>
  );
}

export default function OffsetPortableText({
  title,
  portableTextRaw,
  buttons,
}) {
  return (
    <>
      <Box sx={{ position: "relative" }}>
        <Container>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: ["1fr", "1fr 1fr"],
              paddingY: "96px",
              maxWidth: "1600px",
              marginLeft: "auto",
              marginRight: "auto",
            }}>
            <Box></Box>
            <Box sx={{ paddingX: ["16px", "50px"], zIndex: 1 }}>
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
              {portableTextRaw && <PortableText value={portableTextRaw} />}
              {buttons &&
                Array.isArray(buttons) &&
                buttons.map((button) => (
                  <CustomLinkResolver button={button} key={button._key} />
                ))}
            </Box>
          </Box>
        </Container>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            position: "absolute",
            width: "100%",
            height: "100%",
            left: 0,
            top: 0,
          }}>
          <Box
            sx={{
              background: [
                `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 20px,
            #66677450 20px,
            #66677450 21px
          );`,
                `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 20px,
            #666774 20px,
            #666774 21px
          );`,
              ],
            }}></Box>
        </Box>
      </Box>
    </>
  );
}
