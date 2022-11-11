import { Link as A, Box as LiveBox } from "@livepeer/design-system";
import { Text, Container, Box } from "@theme-ui/components";

export const CenterTitle = () => {
  return (
    <Box sx={{ paddingY: "64px" }}>
      <Container css={{ maxWidth: "800px", textAlign: "center" }}>
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
          Web3 Video. Fast.
        </LiveBox>
        <Text sx={{ maxWidth: "640px", marginX: "auto" }}>
          Livepeer Studio is the complete video solution that provides
          developers with all the tooling needed to add web3 video to their
          apps.
        </Text>
      </Container>
    </Box>
  );
};
