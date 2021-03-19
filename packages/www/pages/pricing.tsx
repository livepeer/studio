import { Box, Heading, Container } from "@theme-ui/components";
import PricingCard, {
  PricingCardContent,
} from "components/Pricing/pricingCard";
import PricingCardsContainer from "components/Pricing/pricingCardsContainer";
import Layout from "../components/Layout";

const Pricing = () => {
  return (
    <Layout
      title={`Pricing - Livepeer.com`}
      description={`Flexible pricing for projects of all sizes.`}
      url={`https://livepeer.com`}
      withGradientBackground>
      <Container>
        <Box sx={{ pt: 5, pb: [0, 0, 0, 5], textAlign: "center" }}>
          <Heading
            as="h1"
            sx={{
              letterSpacing: [0, 0, 0, "-5px"],
              mb: [4, 4, 4, 5],
              fontSize: [6, 6, 6, 9],
              fontWeight: 800,
              lineHeight: ["50px", "50px", "50px", "88px"],
            }}>
            <span sx={{ fontWeight: "normal" }}>Start free.</span>
            <br />
            Then pay as you grow.
          </Heading>
          <Heading
            as="h2"
            sx={{ fontSize: [3, 3, 3, 4], fontWeight: "normal" }}>
            Flexible pricing for projects of all sizes.
          </Heading>
        </Box>
        <PricingCardsContainer />
      </Container>
    </Layout>
  );
};

export default Pricing;
