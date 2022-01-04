import { Box, Container, Heading, Grid } from "@livepeer.com/design-system";
import Fade from "react-reveal/Fade";
import Layout from "layouts/main";
import Prefooter from "@components/Marketing/Prefooter";
import Guides from "@components/Marketing/Guides";
import JobApplicationForm from "@components/Marketing/JobApplicationForm";

const Page = ({
  slug,
  title,
  metaTitle,
  metaDescription,
  metaUrl,
  body,
  noindex = false,
  preview,
  questions,
  name,
  resume,
  coverLetter,
  phone,
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
              lineHeight: "1.2 !important",
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
                mx: "auto",
                mt: "100px",
                "@bp2": {
                  mr: "0",
                },
              }}>
              <JobApplicationForm
                id={slug}
                name={name}
                questions={questions}
                resume={resume}
                coverLetter={coverLetter}
                phone={phone}
              />
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
  const jobsRes = await fetch(`https://livepeer.org/api/teamtailor/jobs`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((response) => response.json());

  let paths = [];
  jobsRes.data.map((page) => paths.push({ params: { slug: page.id } }));
  return {
    fallback: true,
    paths,
  };
}

export async function getStaticProps({ params, preview = false }) {
  const { slug } = params;

  const jobRes = await fetch(
    `https://livepeer.org/api/teamtailor/jobs/${slug}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  ).then((response) => response.json());

  const questionIdsRes = await fetch(
    `https://livepeer.org/api/teamtailor/questionids/${slug}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  ).then((response) => response.json());

  const qIdsData = questionIdsRes["data"];
  const questions = [];
  if (qIdsData)
    for (const questionId of qIdsData) {
      const questionRes = await fetch(
        `https://livepeer.org/api/teamtailor/questions/${questionId.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      ).then((response) => response.json());

      questions.push({
        ...questionRes.data,
      });
    }

  return {
    props: {
      ...jobRes.data,
      questions,
      slug,
      preview,
    },
    revalidate: 1,
  };
}

export default Page;
