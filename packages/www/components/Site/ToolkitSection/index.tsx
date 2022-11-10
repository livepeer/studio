import { Container, Box, Flex, Heading, Text } from "@livepeer/design-system";
import Card from "components/Site/Card";
import BulletedTitle from "components/Site/BulletedTitle";

const ToolkitSection = ({ content }) => {
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
        size="5"
        css={{
          px: 0,
        }}>
        <Box css={{ maxWidth: 600, px: "$3" }}>
          <BulletedTitle css={{ mb: "$4", color: "$hiContrast" }}>
            Toolkit
          </BulletedTitle>
          <Heading size="4" css={{ mb: "$5", letterSpacing: "-1px" }}>
            {content.Headline}
          </Heading>
          <Text size="5" css={{ fontWeight: 400, mb: 60 }}>
            {content.description}
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
              label={content.feature1.numeronym}
              title={content.feature1.title}
              description={content.feature1.description}
              height={690}
              bc="white"
              color="$loContrast"
              // cta={{
              //   href: "https://livepeer.studio/docs/guides/start-live-streaming/tutorial",
              //   isExternal: true,
              // }}
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
              label={content.feature2.numeronym}
              title={content.feature2.title}
              description={content.feature2.description}
              height={320}
              bc="#0A5CD8"
              color="white"
              // cta={{
              //   href: "https://livepeer.studio/docs/guides/upload-a-video",
              //   isExternal: true,
              // }}
            />
            <Card
              label={content.feature3.numeronym}
              title={content.feature3.title}
              description={content.feature3.description}
              height={320}
              bc="#BFE7F8"
              color="$loContrast"
              // cta={{
              //   href: "https://livepeer.studio/docs/guides/video-nfts/mint-a-video-nft",
              //   isExternal: true,
              // }}
            />
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
};

export default ToolkitSection;
