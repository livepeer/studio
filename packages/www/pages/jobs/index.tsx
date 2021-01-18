import { Box, Container, Grid, Link as A } from "@theme-ui/components";
import { GraphQLClient } from "graphql-request";
import { print } from "graphql/language/printer";
import Link from "next/link";
import Fade from "react-reveal/Fade";

import Layout from "../../components/Layout";
import Prefooter from "../../components/Prefooter";
import allJobs from "../../queries/allJobs.gql";

const Page = ({ positions, preview }) => {
  const getFirstParagraph = (content) => {
    return !!content.split("\n")[1]
      ? content.split("\n")[1]
      : content.split("\n")[2];
  };

  return (
    <Layout
      title={`Jobs - Livepeer.com`}
      description={`Join Us. From Anywhere.`}
      url={`https://livepeer.com/jobs`}
      preview={preview}
      withGradientBackground>
      <Container
        sx={{
          pb: 5,
          ul: { mb: 4 },
          p: { mb: 4 },
          maxWidth: 960,
          margin: "0 auto",
        }}>
        <h1
          sx={{
            lineHeight: ["48px", "72px"],
            my: [4, 5],
            fontSize: ["40px", "8"],
            letterSpacing: "-0.05em",
            textAlign: "center",
          }}>
          Join Livepeer, Inc.
        </h1>
        <Grid columns={1} mb={5} gap={4}>
          {positions.map((p, i) => {
            return (
              <Link
                key={i}
                href={p.title === "All" ? "/jobs" : `/jobs/[slug]`}
                as={p.title === "All" ? "/jobs" : `/jobs/${p.slug.current}`}
                passHref>
                <A
                  sx={{
                    width: "100%",
                    display: "block",
                    textDecoration: "none",
                    color: "initial",
                    marginRight: "auto",
                    cursor: "pointer",
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
                  <p
                    sx={{
                      fontSize: [24, 32],
                      fontWeight: 600,
                      px: 4,
                      pt: 4,
                      mr: 4,
                      mb: 0,
                    }}>
                    {p.title}
                  </p>
                  <Box
                    sx={{
                      color: "gray",
                      fontWeight: 400,
                      px: 4,
                      pb: 4,
                      mr: 4,
                    }}>
                    <Box
                      sx={{
                        display: "-webkit-box",
                        textOverflow: "ellipsis",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}>
                      {getFirstParagraph(p.body)}
                    </Box>
                  </Box>
                  <p
                    sx={{
                      color: "primary",
                      fontWeight: 600,
                      px: 4,
                      mr: 4,
                      mb: 0,
                    }}>
                    Apply
                  </p>
                </A>
              </Link>
            );
          })}
        </Grid>
      </Container>
      <Fade key={0}>
        <Prefooter />
      </Fade>
    </Layout>
  );
};

export async function getStaticProps({ params, preview = false }) {
  const graphQLClient = new GraphQLClient(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default"
  );

  let data: any = await graphQLClient.request(print(allJobs), {
    where: {},
  });

  return {
    props: {
      positions: data.allJob,
      preview: false,
    },
    revalidate: 1,
  };
}

export default Page;
