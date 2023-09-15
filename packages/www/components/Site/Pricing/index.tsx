import { Box, Grid, Flex, Text, Tooltip } from "@livepeer/design-system";
import PricingCard, { PricingCardContent } from "components/Site/PricingCard";

const PricingCardsContainer = () => {
  return (
    <Flex
      direction="column"
      css={{
        px: "36px",
        maxWidth: "1245px",
        margin: "0 auto",
        width: "100%",
        pb: "$9",
        "@bp2": {
          overflow: "scroll",
          px: 0,
        },
      }}>
      <Grid
        css={{
          position: "relative",
          gap: "8px",
          grid: "1fr/repeat(1,1fr)",
          "@bp2": {
            justifyContent: "center",
            position: "relative",
            "-webkit-overflow-scrolling": "touch",
            maxWidth: 1245,
            minWidth: 1245,
            gridTemplateColumns: "10% 21.5% 21.5% 21.5% 21.5%",
          },
        }}>
        <Box
          css={{
            flexDirection: "column",
            px: "$2",
            display: "none",
            "@bp2": {
              display: "block",
              pt: 110,
            },
          }}>
          <Box css={{ fontWeight: 600, fontSize: "$5", mb: "$5" }}>
            Features
          </Box>
          <PricingCardContent>
            <Tooltip
              multiline
              content=" Create multiple versions of your source stream for different
              devices in real time.">
              <Text
                size="3"
                css={{
                  fontWeight: 600,
                  mb: "$1",
                  textDecoration: "underline dotted rgb(67, 76, 88)",
                  cursor: "default",
                }}>
                Transcoding
              </Text>
            </Tooltip>
          </PricingCardContent>
          <PricingCardContent>
            <Tooltip
              multiline
              content=" Deliver high-quality playback on whatever device or bandwidth the
              end viewer is watching.">
              <Text
                size="3"
                css={{
                  fontWeight: 600,
                  mb: "$1",
                  textDecoration: "underline dotted rgb(67, 76, 88)",
                  cursor: "default",
                }}>
                Delivery
              </Text>
            </Tooltip>
          </PricingCardContent>
          <PricingCardContent>
            <Tooltip
              multiline
              content="Store video content reliably on decentralized or traditional cloud
              storage providers.">
              <Text
                size="3"
                css={{
                  fontWeight: 500,
                  mb: "$1",
                  textDecoration: "underline dotted rgb(67, 76, 88)",
                  cursor: "default",
                }}>
                Storage
              </Text>
            </Tooltip>
          </PricingCardContent>
        </Box>

        {/* Hacker */}
        <PricingCard
          pricingTitle="Hacker"
          pricingDescription="Free"
          bc="$green3"
          titleColor="black"
          btn={{
            display: "Sign up",
            href: "https://livepeer.studio/register",
            color: "$loContrast",
            bc: "$sage12",
          }}>
          <Box css={{ mt: "20px" }}>
            <PricingCardContent>
              <Box
                css={{
                  alignSelf: "center",
                  mb: "$2",
                  fontWeight: 600,
                  fontSize: "$3",
                  "@bp3": {
                    display: "none",
                  },
                }}>
                Transcoding
              </Box>
              <Flex
                css={{
                  fontSize: "14px",
                  lineHeight: "24px",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "$2",
                }}>
                1,000 minutes{" "}
              </Flex>
            </PricingCardContent>
            <PricingCardContent>
              <Box
                css={{
                  alignSelf: "center",
                  mb: "$2",
                  fontWeight: 600,
                  fontSize: "$3",
                  "@bp3": {
                    display: "none",
                  },
                }}>
                Delivery
              </Box>
              <Flex
                css={{
                  fontSize: "14px",
                  lineHeight: "24px",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "$2",
                }}>
                10,000 minutes{" "}
              </Flex>
            </PricingCardContent>
            <PricingCardContent>
              <Box
                css={{
                  alignSelf: "center",
                  mb: "$2",
                  fontWeight: 600,
                  fontSize: "$3",
                  "@bp3": {
                    display: "none",
                  },
                }}>
                Storage
              </Box>
              <Flex
                css={{
                  fontSize: "14px",
                  lineHeight: "24px",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "$2",
                }}>
                1,000 minutes{" "}
              </Flex>
            </PricingCardContent>
          </Box>
        </PricingCard>

        {/* Growth */}
        <PricingCard
          pricingTitle="Growth"
          pricingDescription="$100 per month*"
          bc="$green5"
          btn={{
            display: "Sign up",
            href: "https://livepeer.studio/register",
            color: "$loContrast",
            bc: "$sage12",
          }}>
          <Box css={{ mt: "20px" }}>
            <PricingCardContent>
              <Box
                css={{
                  alignSelf: "center",
                  mb: "$2",
                  fontWeight: 600,
                  fontSize: "$3",
                  "@bp3": {
                    display: "none",
                  },
                }}>
                Transcoding
              </Box>
              <Flex
                css={{
                  fontSize: "14px",
                  lineHeight: "24px",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "$2",
                }}>
                3,000 minutes{" "}
                <Tooltip multiline content="Then $5.50 per extra 1,000 minutes">
                  <Flex
                    css={{
                      borderRadius: 1000,
                      bc: "$sage12",
                      color: "white",
                      width: 18,
                      height: 18,
                      fontSize: "$1",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "default",
                    }}>
                    $
                  </Flex>
                </Tooltip>
              </Flex>
            </PricingCardContent>
            <PricingCardContent>
              <Box
                css={{
                  alignSelf: "center",
                  mb: "$2",
                  fontWeight: 600,
                  fontSize: "$3",
                  "@bp3": {
                    display: "none",
                  },
                }}>
                Delivery
              </Box>
              <Flex
                css={{
                  fontSize: "14px",
                  lineHeight: "24px",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "$2",
                }}>
                100,000 minutes{" "}
                <Tooltip multiline content="Then $0.50 per extra 1,000 minutes">
                  <Flex
                    css={{
                      borderRadius: 1000,
                      bc: "$sage12",
                      color: "white",
                      width: 18,
                      height: 18,
                      fontSize: "$1",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "default",
                    }}>
                    $
                  </Flex>
                </Tooltip>
              </Flex>
            </PricingCardContent>
            <PricingCardContent>
              <Box
                css={{
                  alignSelf: "center",
                  mb: "$2",
                  fontWeight: 600,
                  fontSize: "$3",
                  "@bp3": {
                    display: "none",
                  },
                }}>
                Storage
              </Box>
              <Flex
                css={{
                  fontSize: "14px",
                  lineHeight: "24px",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "$2",
                }}>
                10,000 minutes{" "}
                <Tooltip multiline content="Then $3.50 per extra 1,000 minutes">
                  <Flex
                    css={{
                      borderRadius: 1000,
                      bc: "$sage12",
                      color: "white",
                      width: 18,
                      height: 18,
                      fontSize: "$1",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "default",
                    }}>
                    $
                  </Flex>
                </Tooltip>
              </Flex>
              <Box
                css={{
                  position: "absolute",
                  fontSize: 11,
                  bottom: -26,
                  fontStyle: "italic",
                  textAlign: "center",
                  width: "100%",
                }}>
                *Pay as you go past allotted minutes
              </Box>
            </PricingCardContent>
          </Box>
        </PricingCard>

        {/* Scale */}
        <PricingCard
          pricingTitle="Scale"
          pricingDescription="$500 per month*"
          bc="$green6"
          btn={{
            display: "Sign up",
            href: "https://livepeer.studio/register",
            color: "$loContrast",
            bc: "$sage12",
          }}>
          <Box css={{ mt: "20px" }}>
            <PricingCardContent>
              <Box
                css={{
                  alignSelf: "center",
                  mb: "$2",
                  fontWeight: 600,
                  fontSize: "$3",
                  "@bp3": {
                    display: "none",
                  },
                }}>
                Transcoding
              </Box>
              <Flex
                css={{
                  fontSize: "14px",
                  lineHeight: "24px",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "$2",
                }}>
                20,000 minutes{" "}
                <Tooltip multiline content="Then $5.50 per extra 1,000 minutes">
                  <Flex
                    css={{
                      borderRadius: 1000,
                      bc: "$sage12",
                      color: "white",
                      width: 18,
                      height: 18,
                      fontSize: "$1",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "default",
                    }}>
                    $
                  </Flex>
                </Tooltip>
              </Flex>
            </PricingCardContent>
            <PricingCardContent>
              <Box
                css={{
                  alignSelf: "center",
                  mb: "$2",
                  fontWeight: 600,
                  fontSize: "$3",
                  "@bp3": {
                    display: "none",
                  },
                }}>
                Delivery
              </Box>
              <Flex
                css={{
                  fontSize: "14px",
                  lineHeight: "24px",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "$2",
                }}>
                500,000 minutes{" "}
                <Tooltip multiline content="Then $0.50 per extra 1,000 minutes">
                  <Flex
                    css={{
                      borderRadius: 1000,
                      bc: "$sage12",
                      color: "white",
                      width: 18,
                      height: 18,
                      fontSize: "$1",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "default",
                    }}>
                    $
                  </Flex>
                </Tooltip>
              </Flex>
            </PricingCardContent>
            <PricingCardContent>
              <Box
                css={{
                  alignSelf: "center",
                  mb: "$2",
                  fontWeight: 600,
                  fontSize: "$3",
                  "@bp3": {
                    display: "none",
                  },
                }}>
                Storage
              </Box>
              <Flex
                css={{
                  fontSize: "14px",
                  lineHeight: "24px",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "$2",
                }}>
                50,000 minutes{" "}
                <Tooltip multiline content="Then $3.50 per extra 1,000 minutes">
                  <Flex
                    css={{
                      borderRadius: 1000,
                      bc: "$sage12",
                      color: "white",
                      width: 18,
                      height: 18,
                      fontSize: "$1",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "default",
                    }}>
                    $
                  </Flex>
                </Tooltip>
              </Flex>
              <Box
                css={{
                  position: "absolute",
                  fontSize: 11,
                  bottom: -26,
                  fontStyle: "italic",
                  textAlign: "center",
                  width: "100%",
                }}>
                *Pay as you go past allotted minutes
              </Box>
            </PricingCardContent>
          </Box>
        </PricingCard>

        {/* Enterprise */}
        <PricingCard
          pricingTitle="Enterprise"
          pricingDescription="Custom pricing"
          bc="$green7"
          btn={{
            display: "Contact us",
            href: "mailto:help@livepeer.org?subject=Enterprise Pricing Inquiry",
            color: "$loContrast",
            bc: "$sage12",
          }}>
          <Box css={{ mt: "20px" }}>
            <PricingCardContent>
              <Box
                css={{
                  alignSelf: "center",
                  mb: "$2",
                  fontWeight: 600,
                  fontSize: "$3",
                  "@bp3": {
                    display: "none",
                  },
                }}>
                Transcoding
              </Box>
              <Box
                css={{
                  fontSize: "$3",
                }}>
                Custom pricing
              </Box>
            </PricingCardContent>
            <PricingCardContent>
              <Box
                css={{
                  alignSelf: "center",
                  mb: "$2",
                  fontWeight: 600,
                  fontSize: "$3",
                  "@bp3": {
                    display: "none",
                  },
                }}>
                Delivery
              </Box>
              <Box
                css={{
                  fontSize: "$3",
                }}>
                Custom pricing
              </Box>
            </PricingCardContent>
            <PricingCardContent>
              <Box
                css={{
                  alignSelf: "center",
                  mb: "$2",
                  fontWeight: 600,
                  fontSize: "$3",
                  "@bp3": {
                    display: "none",
                  },
                }}>
                Storage
              </Box>
              <Box
                css={{
                  fontSize: "$3",
                }}>
                Custom pricing
              </Box>
            </PricingCardContent>
          </Box>
        </PricingCard>
      </Grid>
    </Flex>
  );
};

export default PricingCardsContainer;
