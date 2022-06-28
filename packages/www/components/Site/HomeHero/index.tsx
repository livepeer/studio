import { Container, Box, Flex, Link as A } from "@livepeer/design-system";
import Button from "@components/Site/Button";
import Link from "next/link";

const HomeHero = ({ content }) => {
  return (
    <Box
      css={{
        position: "relative",
        overflow: "hidden",
        mx: "$3",
      }}>
      <Container
        size="5"
        css={{
          bc: "$hiContrast",
          color: "$loContrast",
          borderTopRightRadius: "$2",
          pt: "$7",
          pb: "$4",
          height: 500,
          px: "$3",
          "@bp2": {
            height: "initial",
            px: "$5",
          },
        }}>
        <Flex
          css={{
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
          }}>
          <Box
            css={{
              fontSize: 46,
              fontWeight: 600,
              textTransform: "uppercase",
              lineHeight: 0.9,
              mt: "$7",
              "@bp1": {
                mt: 0,
                fontSize: 74,
              },
              "@bp2": {
                ml: "$7",
                fontSize: 100,
              },
              "@bp3": {
                fontSize: 120,
              },
              "@bp4": {
                ml: 0,
                mx: "auto",
                fontSize: 130,
              },
            }}>
            <Box>{content.line1}</Box>
            <Box
              css={{
                ml: 0,
                "@bp1": {
                  ml: "$5",
                },
                "@bp2": {
                  ml: "$8",
                },
              }}>
              {content.line2}
            </Box>
            <Box>{content.line3}</Box>
          </Box>
          <Flex
            css={{
              mt: "$9",
              flexDirection: "column",
              "@bp2": {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              },
            }}>
            <Box
              css={{
                fontSize: "$4",
                mb: "$4",
                "@bp2": {
                  maxWidth: 500,
                  mb: 0,
                },
              }}>
              {content.description}
            </Box>
            <Flex align="center">
              <Button
                as={A}
                href={content.secondaryCallToAction.href}
                target={
                  content.secondaryCallToAction.isExternal
                    ? "_blank"
                    : undefined
                }
                css={{
                  mr: "$2",
                  backgroundColor: "transparent",
                  color: "$loContrast",
                  borderColor: "$loContrast",
                  fontSize: 20,
                  fontWeight: 500,
                  borderRadius: "$1",
                  px: "6px",
                  py: 0,
                  textDecoration: "none",
                  "@bp2": {
                    fontSize: 24,
                    px: "4px",
                    py: "2px",
                    mr: "$3",
                  },
                  "@bp3": {
                    fontSize: 34,
                  },
                  "&:hover": {
                    bc: "$loContrast",
                    color: "white",
                    textDecoration: "none",
                  },
                }}>
                {content.secondaryCallToAction.title}
              </Button>
              <Link href={content.primaryCallToAction.href} passHref>
                <Button
                  as={A}
                  target={
                    content.primaryCallToAction.isExternal
                      ? "_blank"
                      : undefined
                  }
                  css={{
                    bc: "#0A5CD8",
                    fontSize: 20,
                    fontWeight: 500,
                    borderRadius: "$1",
                    px: "6px",
                    py: 0,
                    textDecoration: "none",
                    "&hover": {
                      textDecoration: "none",
                    },
                    "@bp2": {
                      fontSize: 24,
                      px: "4px",
                      py: "2px",
                    },
                    "@bp3": {
                      fontSize: 34,
                    },
                  }}>
                  {content.primaryCallToAction.title}
                </Button>
              </Link>
            </Flex>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
};

export default HomeHero;
