import Layout from "layouts/main";
import { Box, Flex, Button, Container } from "@livepeer/design-system";
import { Contact as Content } from "content";
import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";

const LivePage = () => {
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
              py: "$6",
              px: "$4",
            },
          }}>
          <Box css={{ textAlign: "center", maxWidth: 890, m: "0 auto" }}>
            <Box
              as="h1"
              css={{
                fontSize: 70,
                lineHeight: "60px",
                fontWeight: 600,
                letterSpacing: "-1px",
                mb: "$6",
              }}>
              LIVE STREAM TO MILLIONS. GET STARTED IN MINUTES.
            </Box>

            <Flex align="center" justify="center">
              <Link href="/register" passHref>
                <Button
                  target="_blank"
                  size={4}
                  as="a"
                  css={{ mr: "$2", gap: "$2" }}
                  variant="green">
                  Get Started
                  <FiArrowUpRight />
                </Button>
              </Link>
            </Flex>
          </Box>
        </Container>

        <Container
          css={{
            maxWidth: "960px",
            pb: 100,
            mx: "auto",
          }}></Container>
      </Box>
    </Layout>
  );
};

export async function getStaticProps() {
  return {
    props: {},
    revalidate: 1,
  };
}

LivePage.theme = "light-theme-green";
export default LivePage;
