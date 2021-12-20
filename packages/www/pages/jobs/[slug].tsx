import {
  Box,
  Container,
  Heading,
  Text,
  Grid,
} from "@livepeer.com/design-system";
import Fade from "react-reveal/Fade";
import Layout from "layouts/main";
import Prefooter from "@components/Marketing/Prefooter";
import Guides from "@components/Marketing/Guides";
import {
  getJobs,
  getJobById,
  getQuestionIdsByJobId,
  getQuestionsById,
} from "hooks";
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
              lineHeight: '1.2 !important',
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
  const questionIds = await getQuestionIdsByJobId(slug);

  const questions = [];
  for (const questionId of questionIds) {
    const question = await getQuestionsById(questionId.id);

    questions.push({
      id: question.id,
      type: question.attributes["question-type"],
      title: question.attributes.title,
    });
  }

  return {
    props: {
      title: job.attributes.title,
      body: job.attributes.body,
      name: job.attributes["name-requirement"],
      resume: job.attributes["resume-requirement"],
      coverLetter: job.attributes["cover-letter-requirement"],
      phone: job.attributes["phone-requirement"],
      questions,
      slug,
      preview,
    },
    revalidate: 1,
  };
}

export default Page;
