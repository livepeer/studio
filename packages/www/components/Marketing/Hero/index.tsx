import { Box, Flex, Container, Text } from "@livepeer.com/design-system";
import Guides from "@components/Marketing/Guides";
import Image from "next/image";
import Link from "next/link";
import Button from "@components/Marketing/Button";
import ArrowLink from "@components/Marketing/ArrowLink";

const Hero = ({
  heading,
  tagline,
  description,
  centered = false,
  skinny = false,
  image,
  imageType = "rectangle",
  ctas = [],
}) => {
  return (
    <Box>
      <Guides backgroundColor="$loContrast" />
      <Box css={{ position: "relative" }}>
        <Container
          size="3"
          css={{
            px: "$4",
            mx: "$4",
            "@bp3": {
              px: "$4",
              mx: "auto",
            },
          }}>
          <Flex
            align="center"
            justify={centered ? "center" : "between"}
            css={{
              textAlign: centered ? "center" : "left",
              mb: skinny ? 0 : 100,
              width: "100%",
              pt: 50,
              "@bp2": {
                height: skinny ? 300 : "calc(100vh - 180px)",
              },
            }}>
            <Flex direction="column" css={{ maxWidth: 700 }}>
              {tagline && (
                <Text
                  variant="violet"
                  size="5"
                  css={{ fontWeight: 600, mb: "$5" }}>
                  {tagline}
                </Text>
              )}
              <Box
                css={{
                  fontWeight: 700,
                  fontSize: "$8",
                  lineHeight: 1.3,
                  color: "$hiContrast",
                  mb: "$6",
                  "@bp2": {
                    fontSize: "$9",
                    lineHeight: "68px",
                    letterSpacing: "-2px",
                  },
                }}>
                {heading}
              </Box>
              <Text
                size="5"
                variant="gray"
                css={{ mb: "$6", lineHeight: 1.6, maxWidth: 540 }}>
                {description}
              </Text>
              {ctas?.length > 0 && (
                <Flex align="center" justify={centered ? "center" : "start"}>
                  <Link href={ctas[0].href} passHref>
                    <Button as="a" arrow css={{ mr: "$4" }}>
                      {ctas[0].children}
                    </Button>
                  </Link>
                  <ArrowLink href={ctas[1].href}>{ctas[1].children}</ArrowLink>
                </Flex>
              )}
            </Flex>
            {image && (
              <Box
                css={{
                  mt: 40,
                  position: "relative",
                  mr: -120,
                  display: "none",
                  "@bp2": {
                    display: "block",
                  },
                }}>
                {imageType === "rectangle" ? (
                  <Box
                    css={{
                      position: "absolute",
                      transform: "translate(-50%)",
                      left: "50%",
                    }}>
                    <Image src={image} width={542 / 2} height={1096 / 2} />
                  </Box>
                ) : (
                  <Box
                    css={{
                      position: "absolute",
                      transform: "translate(-50%)",
                      left: "50%",
                      top: "-5%",
                      width: "110%",
                      height: "110%",
                    }}>
                    <Image src={image} objectFit="cover" layout="fill" />
                  </Box>
                )}
                <Box
                  css={{
                    width: 545,
                    height: 545,
                    minWidth: 545,
                    minHeight: 545,
                    borderRadius: 1000,
                    background:
                      "linear-gradient(90deg, rgba(107, 87, 214, 0.1) 0%, rgba(183, 167, 245, 0.1) 100%)",
                  }}
                />
              </Box>
            )}
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default Hero;
