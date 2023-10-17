import Layout from "layouts/main";
import {
  Box,
  Flex,
  Button,
  Heading,
  Text,
  Container,
} from "@livepeer/design-system";
import Pricing from "components/Site/Pricing";
import ReactMarkdown from "react-markdown";
import { promises as fs } from "fs";
import path from "path";
import { Contact as Content } from "content";
import { Callout } from "@radix-ui/themes";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";

const TranscodingPage = () => {
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
              VIDEO TRANSCODING, EVOLVED
            </Box>
            <Text size={5} css={{ lineHeight: 1.7, mb: "$5" }}>
              Livepeer Studio is powered by the Livepeer Network, the most
              advanced transcoding infrastructure for on-demand and live video.
            </Text>
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

TranscodingPage.theme = "light-theme-green";
export default TranscodingPage;
