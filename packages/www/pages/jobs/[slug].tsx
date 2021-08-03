import {
  Box,
  Container,
  Heading,
  Text,
  Grid,
} from "@livepeer.com/design-system";
import { GraphQLClient, request } from "graphql-request";
import { print } from "graphql/language/printer";
import ReactMarkdown from "react-markdown";
import Fade from "react-reveal/Fade";
import Button from "@components/Marketing/Button";
import Layout from "layouts/redesign";
import Prefooter from "@components/Marketing/Prefooter";
import allJobs from "../../queries/allJobs.gql";
import Code from "@components/Marketing/Code";
import Link from "next/link";
import Guides from "@components/Marketing/Guides";

const Page = ({ title, slug, body, noindex = false, preview }) => {
  return (
    <Layout
      title={`${title} - Livepeer.com`}
      description={`Join Us. From Anywhere.`}
      url={`https://livepeer.com/jobs/${slug}`}
      canonical={`https://livepeer.com/jobs/${slug}`}
      noindex={noindex}
      preview={preview}>
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
          <Heading
            size="4"
            as="h1"
            css={{
              my: "$5",
              fontWeight: 600,
            }}>
            {title}
          </Heading>
          <Grid
            css={{
              maxWidth: 1200,
              mx: "auto",
              gridTemplateColumns: "repeat(1,1fr)",
              "@bp2": {
                gridTemplateColumns: "repeat(2,1fr)",
              },
            }}>
            <Box
              css={{
                "p, div, ul, li": {
                  lineHeight: 1.8,
                  color: "$gray11",
                },
                "h1, h2, h3, h4, h5, h6": {
                  color: "$hiContrast",
                  lineHeight: 1.5,
                },
                strong: {
                  color: "$hiContrast",
                },
                em: {
                  color: "$hiContrast",
                },
                figure: {
                  m: 0,
                },
                img: {
                  width: "100%",
                },
                a: {
                  color: "$violet9",
                },
              }}>
              <ReactMarkdown renderers={{ code: Code }}>{body}</ReactMarkdown>
            </Box>
            <Box
              css={{
                position: "sticky",
                top: "100px",
                display: "block",
                alignSelf: "start",
                ml: "auto",
                px: "$6",
                py: "$5",
                borderRadius: 24,
                border: "1px solid",
                borderColor: "$mauve5",
                bc: "$mauve2",
                transition: "box-shadow .2s",
                "&:hover": {
                  textDecoration: "none",
                  boxShadow:
                    "0px 2px 1px rgba(0, 0, 0, 0.04), 0px 16px 40px rgba(0, 0, 0, 0.04)",
                },
                "@bp2": {
                  width: 380,
                },
              }}>
              <Text size="5" css={{ mb: "$2" }}>
                How to Apply
              </Text>
              <Text variant="gray" css={{ mb: "$4" }}>
                If you are interested in applying for this position, please send
                an email containing your Github profile and/or LinkedIn.
              </Text>
              <Link href="mailto:work@livepeer.com" passHref>
                <Button size="4" as="a" arrow css={{ width: "100%" }}>
                  Send email
                </Button>
              </Link>
            </Box>
          </Grid>
        </Container>
      </Box>
      <Fade key={0}>
        <Prefooter />
      </Fade>
    </Layout>
  );
};

export async function getStaticPaths() {
  const { allJob } = await request(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default",
    print(allJobs),
    {
      where: {},
    }
  );
  let paths = [];
  allJob.map((page) => paths.push({ params: { slug: page.slug.current } }));
  return {
    fallback: true,
    paths,
  };
}

export async function getStaticProps({ params, preview = false }) {
  const { slug } = params;
  const graphQLClient = new GraphQLClient(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default"
  );

  let data: any = await graphQLClient.request(print(allJobs), {
    where: {
      slug: { current: { eq: slug } },
    },
  });

  let job = data.allJob.find((j) => j.slug.current === slug);

  return {
    props: {
      ...job,
      slug,
      preview,
    },
    revalidate: 1,
  };
}

export default Page;
