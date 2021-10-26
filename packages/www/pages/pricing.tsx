import Layout from "layouts/main";
import { Box, Heading, Text, Container } from "@livepeer.com/design-system";
import Prefooter from "@components/Marketing/Prefooter";
import PricingCalculator from "@components/Marketing/Pricing/pricingCalculator";
import PricingCardsContainer from "@components/Marketing/Pricing/pricingCardsContainer";
import Guides from "@components/Marketing/Guides";
import { Pricing as Content } from "content";

const PricingPage = () => {
  return (
    <Layout {...Content.metaData}>
      <Guides />
      <Box css={{ position: "relative" }}>
        <Container
          size="3"
          css={{
            px: "$6",
            py: "$7",
            width: "100%",
            "@bp3": {
              py: "$8",
              px: "$4",
            },
          }}>
          <Box css={{ textAlign: "center", mb: "$5" }}>
            <Heading as="h1" size="4" css={{ fontWeight: 600, mb: "$5" }}>
              Start free.
              <Box css={{ fontWeight: 400 }}>Then pay as you grow.</Box>
            </Heading>
            <Text as="h2" variant="gray" size="6">
              Flexible pricing for projects of all sizes.
            </Text>
          </Box>
        </Container>
        <PricingCardsContainer />
        <Box>
          <Guides backgroundColor="$mauve2" />
          <Box css={{ position: "relative" }}>
            <Container
              size="3"
              css={{
                px: "$6",
                py: "$7",
                width: "100%",
                "@bp3": {
                  py: "$8",
                  px: "$4",
                },
              }}>
              <PricingCalculator />
            </Container>
          </Box>
        </Box>
      </Box>
      <Prefooter />
    </Layout>
  );
};

export default PricingPage;
