import Layout from "layouts/main";
import { Box, Heading, Text, Container } from "@livepeer/design-system";
import Pricing from "components/Site/Pricing";
import ReactMarkdown from "react-markdown";
import { promises as fs } from "fs";
import path from "path";
import { Pricing as Content } from "content";
import { Callout } from "@radix-ui/themes";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import Ripe, { categories, pages } from "lib/ripe";

Ripe.trackPage({
  category: categories.PRICING,
  name: pages.PRICING,
});

const PricingPage = ({ markdownContent }) => {
  return (
    <Layout {...Content.metaData}>
      <Box css={{ position: "relative" }}>
        <Container
          size="4"
          css={{
            maxWidth: "1245px",
            px: "$6",
            py: "$7",
            width: "100%",
            "@bp3": {
              py: "$8",
              px: "$4",
            },
          }}>
          <Box css={{ textAlign: "center", maxWidth: 960, m: "0 auto" }}>
            <Heading as="h1" size="4" css={{ fontWeight: 600, mb: "$6" }}>
              Pricing
            </Heading>
            <Text size={5} css={{ lineHeight: 1.7 }}>
              Find a plan that scales with your needs – from early exploration
              to enterprise scale.
            </Text>
          </Box>
        </Container>
        <Pricing />
        {/* <Container
          size="4"
          css={{
            maxWidth: "1245px",
            mb: "$8",
          }}>
          <Box>
            <Callout.Root>
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                The Livepeer network is open and permissionless, which means
                anyone can run their own Livepeer node and pay the network
                directly, with no middleman. However, running and scaling your
                own node infrastructure can be challenging, especially when
                getting started or scaling rapidly. Enter Livepeer gateway
                providers. Gateway providers host optimized Livepeer node
                infrastructure for you, allowing you to focus on building your
                video applications instead. Livepeer Inc, the initial team
                behind the Livepeer protocol, operates the most popular hosted
                gateway. Information about its pricing structure can be found
                below.
              </Callout.Text>
            </Callout.Root>
          </Box>
        </Container> */}

        <Container
          css={{
            maxWidth: "960px",
            pb: 100,
            mx: "auto",
          }}>
          <Box className="markdown-body">
            <ReactMarkdown children={markdownContent} />
          </Box>
        </Container>
      </Box>
    </Layout>
  );
};

export async function getStaticProps() {
  const filePath = path.join(
    process.cwd(),
    "components/Site/Pricing",
    "faq.md"
  );
  const markdownContent = await fs.readFile(filePath, "utf8");

  return {
    props: {
      markdownContent,
    },
    revalidate: 1,
  };
}

PricingPage.theme = "light-theme-green";
export default PricingPage;
