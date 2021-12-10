import {
  Box,
  Container,
  Heading,
  Text,
  Grid,
} from "@livepeer.com/design-system";
import ReactMarkdown from "react-markdown";
import Fade from "react-reveal/Fade";
import Button from "@components/Marketing/Button";
import Layout from "layouts/main";
import Prefooter from "@components/Marketing/Prefooter";
import Code from "@components/Marketing/Code";
import Link from "next/link";
import Guides from "@components/Marketing/Guides";
import { getJobs, getJobById } from "hooks";

const Page = ({
  title,
  metaTitle,
  metaDescription,
  metaUrl,
  body,
  noindex = false,
  preview,
}) => {
  return (
    <Layout
      title={metaTitle}
      description={metaDescription}
      url={metaUrl}
      canonical={metaUrl}
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
              px: "$4",
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
                  color: "$hiContrast",
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
              <div dangerouslySetInnerHTML={{ __html: body }} />
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
  const allJob = await getJobs();
  let paths = [];
  allJob.map((page) => paths.push({ params: { slug: page.id } }));
  return {
    fallback: true,
    paths,
  };
}

export async function getStaticProps({ params, preview = false }) {
  const { slug } = params;
  const job = await getJobById(slug);
  return {
    props: {
      title: job.attributes.title,
      body: job.attributes.body,
      slug,
      preview,
    },
    revalidate: 1,
  };
}

export default Page;
