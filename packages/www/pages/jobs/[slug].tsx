/** @jsx jsx */
import { jsx } from "theme-ui";
import { Box, Container, Grid } from "@theme-ui/components";
import { GraphQLClient, request } from "graphql-request";
import { print } from "graphql/language/printer";
import ReactMarkdown from "react-markdown";
import Fade from "react-reveal/Fade";
import Button from "../../components/Button";
import Layout from "../../layouts";
import Prefooter from "../../components/Prefooter";
import allJobs from "../../queries/allJobs.gql";
import Code from "../../components/renderers/Code";

const Page = ({ title, slug, body, noindex = false, preview }) => {
  return (
    <Layout
      title={`${title} - Livepeer.com`}
      description={`Join Us. From Anywhere.`}
      url={`https://livepeer.com/jobs/${slug}`}
      canonical={`https://livepeer.com/jobs/${slug}`}
      noindex={noindex}
      preview={preview}>
      <Container
        sx={{
          pb: 5,
          ul: { mb: 4 },
          p: { mb: 4 },
        }}>
        <h1
          sx={{
            lineHeight: ["42px", "72px"],
            my: 5,
            fontSize: ["32px", "56px"],
          }}>
          {title}
        </h1>
        <Grid columns={[1, 1, 2]} sx={{ maxWidth: 1200, margin: "0 auto" }}>
          <ReactMarkdown className="markdown-body" renderers={{ code: Code }}>
            {body}
          </ReactMarkdown>
          <Box
            sx={{
              position: "sticky",
              top: "100px",
              display: "block",
              alignSelf: "start",
              width: ["100%", null, "380px"],
              ml: "auto",
              p: 4,
              textDecoration: "none",
              color: "initial",
              marginRight: "auto",
              borderRadius: 24,
              border: "1px solid",
              borderColor: "#F0F0F0",
              backgroundColor: "#FFF",
              overflow: "hidden",
              transition: "box-shadow .2s",
              ":hover": {
                textDecoration: "none",
                boxShadow:
                  "0px 2px 1px rgba(0, 0, 0, 0.04), 0px 16px 40px rgba(0, 0, 0, 0.04)",
              },
            }}>
            <p sx={{ fontSize: 20, mb: 0 }}>How to Apply</p>
            <p sx={{ color: "gray" }}>
              If you are interested in applying for this position, please send
              an email containing your Github profile and/or LinkedIn.
            </p>
            <Button
              isExternal
              isLink
              href="mailto:work@livepeer.com"
              sx={{ width: "100%" }}>
              Send email
            </Button>
          </Box>
        </Grid>
      </Container>
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
    fallback: !process.env.LP_STATIC_BUILD,
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
