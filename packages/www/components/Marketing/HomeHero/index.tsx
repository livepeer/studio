import { Container, Box, Flex, Link as A } from "@livepeer/design-system";
import Button from "@components/Marketing/Button";

const HomeHero = () => {
  return (
    <Box
      css={{
        position: "relative",
        overflow: "hidden",
        bc: "$hiContrast",
        color: "$loContrast",
        ml: "$3",
        mr: "$3",
        borderTopRightRadius: "$2",
        pt: "$7",
        pb: "$4",
        height: 500,
        "@bp2": {
          height: "initial",
        },
      }}>
      <Container
        css={{
          height: "100%",
          px: "$3",
          "@bp2": {
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
            <Box>The video</Box>
            <Box
              css={{
                ml: "$3",
                "@bp1": {
                  ml: "$5",
                },
                "@bp2": {
                  ml: "$8",
                },
              }}>
              toolkit for
            </Box>
            <Box>web3 apps</Box>
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
              Developer tools for building web3 video experiences powered by the
              Livepeer network - the world's open video infrastructure.
            </Box>
            <Flex align="center">
              <Button
                as={A}
                href="https://discord.gg/7D6hGG6dCZ"
                target="_blank"
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
                Join Discord
              </Button>
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
                  "@bp2": {
                    fontSize: 34,
                    px: "4px",
                    py: "2px",
                  },
                }}>
                Let's Go
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
};

export default HomeHero;
