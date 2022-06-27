import { Container, Box, Flex, Heading, Text } from "@livepeer/design-system";
import BulletedTitle from "@components/Site/BulletedTitle";

const PrinciplesSection = ({ content }) => {
  console.log(content);
  return (
    <Box
      css={{
        position: "relative",
        overflow: "hidden",
        ml: "$3",
        mr: "$3",
        borderTopRightRadius: "$2",
        pt: 60,
      }}>
      <Container
        size="5"
        css={{
          px: 0,
          "@bp2": {
            px: "$3",
          },
        }}>
        <Box css={{ maxWidth: 1100 }}>
          <BulletedTitle css={{ mb: "$4", color: "$hiContrast" }}>
            Product Principles
          </BulletedTitle>
          <Heading
            size="4"
            css={{
              fontWeight: 500,
              mb: 100,
              letterSpacing: "-1px",
              "@bp2": {
                mb: 140,
              },
            }}>
            {content.heading}
          </Heading>
        </Box>
        <Flex
          css={{
            borderTop: "1px solid",
            borderColor: "$neutral5",
            flexDirection: "column",
            "@bp2": {
              flexDirection: "row",
            },
          }}>
          <Box
            css={{
              mr: "$5",
              mb: "$4",
              pr: "$4",
              color: "$hiContrast",
              "@bp2": {
                mb: 0,
                borderRight: "1px solid",
                borderColor: "$neutral5",
                width: "33%",
              },
            }}>
            <Text size={4} css={{ pt: "$3", color: "inherit" }}>
              {content.body}
            </Text>
          </Box>
          <Box
            css={{
              fontWeight: 400,
              height: 380,
              pt: "$3",
              fontSize: 32,
              lineHeight: "44px",
              "@bp2": {
                height: 460,
                lineHeight: "56px",
                fontSize: 45,
              },
            }}>
            {(content.principles ?? []).map((principle) => (
              <Box>{principle}</Box>
            ))}
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default PrinciplesSection;
