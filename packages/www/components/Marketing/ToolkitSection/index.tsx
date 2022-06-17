import { Container, Box, Flex, Heading, Text } from "@livepeer/design-system";
import Card from "@components/Marketing/Card";
import BulletedTitle from "@components/Marketing/BulletedTitle";

const ToolkitSection = () => {
  return (
    <Box
      css={{
        position: "relative",
        overflow: "hidden",
        ml: "$3",
        mr: "$3",
        borderTopRightRadius: "$2",
        pt: 50,
        pb: "$4",
        "@bp2": {
          pt: 100,
        },
      }}>
      <Container
        css={{
          px: 0,
          "@bp2": {
            px: "$2",
          },
        }}>
        <Box css={{ maxWidth: 600 }}>
          <BulletedTitle css={{ mb: "$4", color: "$hiContrast" }}>
            Toolkit
          </BulletedTitle>
          <Heading size="4" css={{ mb: "$5", letterSpacing: "-1px" }}>
            Build next-gen, creator-owned video experiences
          </Heading>
          <Text size="5" css={{ fontWeight: 300, mb: 60 }}>
            Livepeer Studio provides all the tools needed to build web3 video
            apps with livestreaming, video on demand, and video NFT minting
            features - web3-native, open infrastructure, affordable.
          </Text>
        </Box>
        <Flex
          gap="4"
          css={{
            flexDirection: "column",
            "@bp2": {
              gap: "$4",
              flexDirection: "row",
            },
          }}>
          <Box
            css={{
              width: "100%",
              "@bp2": {
                width: "50%",
              },
            }}>
            <Card
              lines="midnight"
              lineCount={5}
              label="F.01"
              title="Livestream"
              description="Process live video on the Livepeer network at a fraction of the cost of traditional cloud providers."
              height={690}
              bc="white"
              color="$loContrast"
            />
          </Box>
          <Flex
            direction="column"
            gap="4"
            css={{
              width: "100%",
              "@bp2": {
                width: "50%",
              },
            }}>
            <Card
              label="F.02"
              title="On Demand"
              description="Process live video on the Livepeer network at a fraction of the cost of traditional cloud providers."
              height={320}
              bc="#0A5CD8"
              color="white"
            />
            <Card
              label="F.03"
              title="Mint"
              description="Mint NFTs on popular blockchains and optimize playback in NFT marketplaces, web3 apps, and wallets."
              height={320}
              bc="#BFE7F8"
              color="$loContrast"
            />
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
};

export default ToolkitSection;
