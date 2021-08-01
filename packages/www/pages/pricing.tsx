import Layout from "layouts/redesign";
import { Box, Heading, Text, Container } from "@livepeer.com/design-system";
import Prefooter from "components/Redesign/Prefooter";
import PricingCalculator from "components/Redesign/Pricing/pricingCalculator";
import PricingCardsContainer from "components/Redesign/Pricing/pricingCardsContainer";
import Guides from "components/Redesign/Guides";

const Pricing = () => {
  return (
    <Layout
      title={`Pricing - Livepeer.com`}
      description={`The world’s most affordable, powerful and easy-to-use video streaming API, powered by Livepeer.`}
      url={`https://livepeer.com/pricing`}
      theme="dark">
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
              px: "$3",
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
        <Box css={{ bc: "$mauve2" }}>
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
      <Prefooter />
    </Layout>
  );
};

export default Pricing;
