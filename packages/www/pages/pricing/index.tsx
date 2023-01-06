import Layout from "layouts/main";
import { Box, Heading, Text, Container } from "@livepeer/design-system";
// import Prefooter from "components/Site/Prefooter";
// import PricingCalculator from "components/Site/Pricing/pricingCalculator";
import PricingCardsContainer from "components/Site/Pricing/pricingCardsContainer";
import { Pricing as Content } from "content";
import { client } from "lib/client";
import Fade from "react-reveal/Fade";
import { getComponent } from "lib/utils";

const PricingPage = (pageData, { pageBuilder }) => {
  console.log(pageData);
  return (
    <Layout {...Content.metaData} navBackgroundColor={"$hiContrast"}>
      {pageData.pageBuilder.map((component, i) => (
        <Fade key={i}>{getComponent(component)}</Fade>
      ))}
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
              {/* <PricingCalculator /> */}
            </Container>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export async function getStaticProps() {
  const query = `*[_type=="pricingPage"][0]`;
  const pageData = (await client.fetch(query)) ?? {};
  console.log("pageData: ", pageData);

  return {
    props: {
      ...pageData,
    },
    revalidate: 86400,
  };
}

export default PricingPage;
