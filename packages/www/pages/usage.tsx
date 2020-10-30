import { Box, Heading, Container } from "@theme-ui/components";
import Layout from "../components/Layout";

const Usage = () => {
  return (
    <Layout>
      <Container>
        <Box sx={{ py: 5, textAlign: "center" }}>
          <Heading as="h1" sx={{ mb: 4, fontSize: 9, fontWeight: "bold" }}>
            Usage
          </Heading>
        </Box>
      </Container>
    </Layout>
  );
};

export default Usage;
