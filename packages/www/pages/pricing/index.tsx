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
