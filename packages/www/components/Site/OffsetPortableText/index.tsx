import { Text, Link as A, Box as LiveBox } from "@livepeer/design-system";
import { Container, Box } from "@theme-ui/components";
import Button from "@components/Site/Button";

export const OffsetPortableText = () => {
  return (
    <>
      <Box sx={{ position: "relative" }}>
        <Container>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              paddingY: "96px",
            }}>
            <Box></Box>
            <Box sx={{ paddingX: "50px" }}>
              <LiveBox
                css={{
                  fontSize: 58,
                  fontWeight: 600,
                  lineHeight: 1,
                  letterSpacing: "-4px",
                  mb: 32,
                  "@bp1": {
                    fontSize: 58,
                  },
                  "@bp2": {
                    fontSize: 58,
                  },
                  "@bp3": {
                    fontSize: 58,
                  },
                }}>
                Exponential growth with Livepeer Studio
              </LiveBox>
              <Text>
                Why do video apps using decentralized storage have super high
                churn rates? It’s because most of them do not use a service to
                process video. This means that the end user experience is
                generally a video buffering.
              </Text>
              <Text>
                Decentralized storage is not optimized for video streaming.
                Building with decentralized storage and Livepeer Studio creates
                the optimal video viewing experience.
              </Text>
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
                Let's Go
              </Button>
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
              background: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 20px,
            #666774 20px,
            #666774 21px
          );`,
            }}></Box>
        </Box>
      </Box>
    </>
  );
};
