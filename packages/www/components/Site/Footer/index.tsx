import { Heading, Text, Box, Flex, Link as A } from "@livepeer/design-system";
import Button from "@components/Site/Button";
import Link from "next/link";
import CutOut from "@components/Site/CutOut";

const Footer = () => {
  return (
    <Box
      css={{
        position: "relative",
        overflow: "hidden",
        color: "$loContrast",
        mx: "$3",
        mb: "$3",
        zIndex: 1,
      }}>
      <Flex
        css={{
          flexDirection: "column",
          "@bp2": {
            flexDirection: "row",
          },
        }}>
        <Flex
          css={{
            width: "100%",
            flexDirection: "column",
            "@bp2": {
              flexDirection: "row",
              width: "62%",
            },
          }}>
          <Box css={{ width: "100%" }}>
            <Box
              css={{
                position: "relative",
                borderRadius: 40,
                height: 40,
                width: "100%",
              }}>
              <CutOut orientation="left" backgroundColor="$hiContrast" />
            </Box>
            <Box
              css={{
                bc: "$hiContrast",
                width: "100%",
                borderTopLeftRadius: 18,
                borderBottomLeftRadius: 18,
                pl: "$3",
                pr: "$3",
                pb: "$3",
                pt: "$7",
                zIndex: 4,
                height: "calc(100% - 40px)",
                "@bp2": {
                  pt: "$9",
                  pr: 0,
                },
              }}>
              <Box
                css={{
                  fontSize: 96,
                  fontWeight: 600,
                  lineHeight: 0.8,
                  letterSpacing: "-4px",
                  mb: 80,
                  "@bp1": {
                    mb: 120,
                    maxWidth: 400,
                    fontSize: 120,
                  },
                  "@bp2": {
                    mb: 120,
                    maxWidth: 400,
                    fontSize: 140,
                  },
                  "@bp3": {
                    fontSize: 190,
                  },
                }}>
                <Box>
                  Get
                  <br />
                  Started
                </Box>
              </Box>
              <Box css={{ mt: "$9", maxWidth: 600, pb: "$2" }}>
                <Box css={{ mb: "$7", fontSize: "$4" }}>
                  Join the next-gen, creator-owned video ecosystem. From
                  “decentralized YouTube” to video NFT marketplaces, Livepeer
                  Studio empowers developers to build video-enabled applications
                  that give creators total control over their content with no
                  middlemen.
                </Box>
                <Flex align="center">
                  <Link href="/contact" passHref>
                    <Button
                      as={A}
                      css={{
                        mr: "$3",
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
                          fontSize: 34,
                          px: "4px",
                          py: "2px",
                          mr: "$3",
                        },
                        "&:hover": {
                          bc: "$loContrast",
                          color: "white",
                          textDecoration: "none",
                        },
                      }}>
                      Contact
                    </Button>
                  </Link>
                  <Link href="/login" passHref>
                    <Button
                      as={A}
                      small
                      variant="blue"
                      css={{
                        bc: "#0A5CD8",
                        fontSize: 20,
                        fontWeight: 500,
                        borderRadius: "$1",
                        px: "6px",
                        py: 0,
                        textDecoration: "none",
                        "&:hover": {
                          textDecoration: "none",
                        },
                        "@bp2": {
                          fontSize: 34,
                          px: "4px",
                          py: "2px",
                          mr: "$3",
                        },
                      }}>
                      Let's Go
                    </Button>
                  </Link>
                </Flex>
              </Box>
            </Box>
          </Box>
          <Flex
            css={{
              bc: "#0001AE",
              position: "relative",
              height: "100%",
              flexDirection: "column",
              mt: 0,
              "@bp2": {
                mt: 1,
                flexDirection: "row",
              },
            }}>
            <Box
              css={{
                borderBottomRightRadius: "18px",
                borderBottomLeftRadius: "18px",
                bc: "$hiContrast",
                height: 34,
                width: "100%",
                zIndex: 3,
                mt: -16,
                "@bp2": {
                  mt: 0,
                  ml: -16,
                  height: "100%",
                  width: 34,
                  borderBottomRightRadius: "18px",
                  borderTopRightRadius: "18px",
                  borderBottomLeftRadius: 0,
                },
              }}
            />
            <Box
              css={{
                borderBottomRightRadius: "18px",
                borderBottomLeftRadius: "18px",
                bc: "#37B8EE",
                height: 34,
                mt: -16,
                width: "100%",
                zIndex: 2,
                "@bp2": {
                  mt: 0,
                  ml: -16,
                  height: "100%",
                  width: 34,
                  borderBottomRightRadius: "18px",
                  borderTopRightRadius: "18px",
                  borderBottomLeftRadius: 0,
                },
              }}
            />
            <Box
              css={{
                borderBottomRightRadius: "18px",
                borderBottomLeftRadius: "18px",
                bc: "#0197D5",
                height: 34,
                mt: -16,
                width: "100%",
                zIndex: 1,
                "@bp2": {
                  mt: 0,
                  ml: -16,
                  height: "100%",
                  width: 34,
                  borderBottomRightRadius: "18px",
                  borderTopRightRadius: "18px",
                  borderBottomLeftRadius: 0,
                },
              }}
            />
            <Box
              css={{
                borderBottomRightRadius: "18px",
                borderBottomLeftRadius: "18px",
                bc: "#0A5CD8",
                height: 34,
                mt: -16,
                width: "100%",
                zIndex: 0,
                "@bp2": {
                  mt: 0,
                  ml: -16,
                  height: "100%",
                  width: 34,
                  borderBottomRightRadius: "18px",
                  borderTopRightRadius: "18px",
                  borderBottomLeftRadius: 0,
                },
              }}
            />
          </Flex>
        </Flex>
        <Flex
          direction="column"
          justify="between"
          css={{
            px: "$4",
            py: "$5",
            mt: 0,
            width: "100%",
            bc: "#0001AE",
            borderBottomLeftRadius: 18,
            borderBottomRightRadius: 18,
            "@bp2": {
              mt: 1,
              borderTopRightRadius: 18,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 18,
              width: "38%",
            },
          }}>
          <Box>
            <Box css={{ mb: "$5" }}>
              <Heading
                css={{
                  fontWeight: 600,
                  mb: "$1",
                  fontSize: 15,
                  letterSpacing: 0,
                  color: "white",
                }}>
                Why Livepeer Studio
              </Heading>
              <Text
                css={{
                  color: "white",
                  fontWeight: 400,
                  lineHeight: "18px",
                  opacity: ".8",
                }}>
                Livepeer Studio is a powerful suite of web3 tools that make it
                easy for builders to create new video experiences and access the
                decentralized Livepeer network. More than a product, Livepeer
                Studio is a growing community of web3 developers and creators
                creating the future of web3 video.
              </Text>
            </Box>
            <Box css={{ mb: "$9" }}>
              <Heading
                css={{
                  fontWeight: 600,
                  mb: "$1",
                  fontSize: 15,
                  letterSpacing: 0,
                  color: "white",
                }}>
                Why Livepeer
              </Heading>
              <Text
                css={{
                  color: "white",
                  fontWeight: 400,
                  lineHeight: "18px",
                  opacity: ".8",
                }}>
                Livepeer is the world's open video infrastructure. Founded in
                2017, Livepeer provides cost efficient, secure, scalable, and
                reliable infrastructure that can handle today's high demand for
                video processing. Livepeer's decentralized network includes over
                70,000 GPUs and currently processes millions of minutes a week.
              </Text>
            </Box>
            <Heading
              css={{
                color: "white",
                mb: "$6",
                fontSize: 75,
                letterSpacing: "-3px",
              }}>
              Social
            </Heading>
            <Flex gap="2" align="center" css={{ mb: "$6" }}>
              <A
                href="https://twitter.com/livepeerstudio"
                target="_blank"
                css={{
                  fontSize: 40,
                  fontWeight: 500,
                  border: "2px solid white",
                  borderRadius: "4px",
                  lineHeight: 0.9,
                  px: "3px",
                  color: "white",
                  display: "block",
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "none",
                  },
                  "@bp2": {
                    fontSize: 40,
                  },
                  "@bp3": {
                    fontSize: 54,
                  },
                }}>
                TW
              </A>
              <A
                href="https://github.com/livepeer/livepeer-studio"
                target="_blank"
                css={{
                  fontSize: 40,
                  fontWeight: 500,
                  border: "2px solid white",
                  borderRadius: "4px",
                  lineHeight: 0.9,
                  px: "3px",
                  color: "white",
                  display: "block",
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "none",
                  },
                  "@bp2": {
                    fontSize: 40,
                  },
                  "@bp3": {
                    fontSize: 54,
                  },
                }}>
                GH
              </A>
              <A
                href="https://www.youtube.com/channel/UCRbqO1sU_wXMEIJoY9mNDyw"
                target="_blank"
                css={{
                  fontSize: 40,
                  fontWeight: 500,
                  border: "2px solid white",
                  borderRadius: "4px",
                  lineHeight: 0.9,
                  px: "3px",
                  color: "white",
                  display: "block",
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "none",
                  },
                  "@bp2": {
                    fontSize: 40,
                  },
                  "@bp3": {
                    fontSize: 54,
                  },
                }}>
                YT
              </A>
              <A
                href="https://tiktok.com/@livepeerstudio"
                target="_blank"
                css={{
                  fontSize: 40,
                  fontWeight: 500,
                  border: "2px solid white",
                  borderRadius: "4px",
                  lineHeight: 0.9,
                  px: "3px",
                  color: "white",
                  display: "block",
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "none",
                  },
                  "@bp2": {
                    fontSize: 40,
                  },
                  "@bp3": {
                    fontSize: 54,
                  },
                }}>
                TIK
              </A>
            </Flex>
          </Box>
          <Box
            css={{
              a: {
                fontSize: "$4",
                display: "block",
                color: "#F7F7F7",
                opacity: 0.6,
                transition: ".15s",
                textDecoration: "none",
                "&:hover": {
                  opacity: 1,
                  transition: ".15s",
                  textDecoration: "none",
                },
              },
            }}>
            <Link href="/pricing-faq" passHref>
              <A>Pricing</A>
            </Link>
            <A href="https://livepeer.org/jobs" target="_blank">
              Jobs
            </A>
            <A href="https://livepeer-studio.statuspage.io/" target="_blank">
              Status Page
            </A>
            <Link href="/privacy-policy" passHref>
              <A>Privacy Policy</A>
            </Link>
            <Link href="/terms-of-service" passHref>
              <A>Terms of Service</A>
            </Link>
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Footer;
