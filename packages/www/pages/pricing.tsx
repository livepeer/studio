import { Box, Heading, Container } from "@theme-ui/components";
import Layout from "../components/Layout";
import Plans from "../components/Plans";

const Pricing = () => {
  return (
    <Layout
      title={`Pricing - Livepeer.com`}
      description={`Flexible pricing for projects of all sizes.`}
      url={`https://livepeer.com`}
      withGradientBackground
    >
      <Container>
        <Box sx={{ py: 5, textAlign: "center" }}>
          <Heading
            as="h1"
            sx={{
              letterSpacing: "-5px",
              mb: 5,
              fontSize: 9,
              fontWeight: 800,
              lineHeight: "88px"
            }}
          >
            <span sx={{ fontWeight: "normal" }}>Start free.</span>
            <br />
            Then pay as you grow.
          </Heading>
          <Heading as="h2" sx={{ fontSize: 4, fontWeight: "normal" }}>
            Flexible pricing for projects of all sizes.
          </Heading>
        </Box>
        <Plans />
      </Container>
    </Layout>
  );
};

export default Pricing;
