import Fade from "react-reveal/Fade";
import Layout from "../components/Layout";
import { Box, Container } from "@theme-ui/components";
import Prefooter from "../components/Prefooter";
import TeamSection from "../components/TeamSection";
import { GraphQLClient } from "graphql-request";
import { print } from "graphql/language/printer";
import allPages from "../queries/allPages.gql";

// TODO this page is sort of a hybrid between sanity and hardcoded
// Maybe we should update the sanity structure a bit and use it fully
const AboutPage = ({ content }) => {
  const [, { teamMembers }] = content;
  return (
    <Layout
      title={`About - Livepeer.com`}
      description={`Scalable, secure live transcoding at a fraction of the cost`}
      url={`https://livepeer.com/about`}
      withGradientBackground
    >
      <Container variant="hero">
        <h1 sx={{ variant: "text.heading.hero" }}>
          We’re building the future of video infrastructure services.
        </h1>
        <p sx={{ maxWidth: 728, variant: "text.heroDescription" }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ornare
          quam ac maximus aliquet. Pellentesque semper lobortis nunc vitae
          porta. Sed faucibus turpis.
        </p>
      </Container>
      <TeamSection teamMembers={teamMembers} />
      <hr sx={{ visibility: "hidden", my: 5 }} />
      <Fade key={0}>
        <Prefooter />
      </Fade>
    </Layout>
  );
};

export async function getStaticProps() {
  const graphQLClient = new GraphQLClient(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default"
  );

  const data: any = await graphQLClient.request(print(allPages), {
    where: {
      slug: { current: { eq: "team" } }
    }
  });

  return {
    props: {
      ...data.allPage[0],
      preview: false
    },
    revalidate: 1
  };
}

export default AboutPage;
