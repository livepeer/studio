import Fade from "react-reveal/Fade";
import Layout from "layouts/redesign";
import { Container, Box, Heading, Text } from "@livepeer.com/design-system";
import Prefooter from "@components/Marketing/Prefooter";
import TeamSection from "../components/Marketing/TeamSection";
import Guides from "@components/Marketing/Guides";
import { GraphQLClient } from "graphql-request";
import { print } from "graphql/language/printer";
import allPages from "../queries/allPages.gql";

const TeamPage = ({ content }) => {
  const [, { teamMembers }] = content;
  return (
    <Layout
      title={`Team - Livepeer.com`}
      description={`We’re building the future of video infrastructure services.`}
      url={`https://livepeer.com/team`}
      canonical={`https://livepeer.com/team`}>
      <Guides />
      <Box css={{ position: "relative" }}>
        <Container
          size="3"
          css={{
            px: "$6",
            py: "$8",
            width: "100%",
            "@bp3": {
              py: "$9",
              px: "$4",
            },
          }}>
          <Box css={{ maxWidth: 768, mx: "auto", textAlign: "center" }}>
            <Heading size="4" css={{ fontWeight: 600, mb: "$4" }}>
              We’re building the future of video infrastructure services.
            </Heading>
            <Text variant="gray" size="5">
              We're comprised of team members dedicated to building affordable,
              scalable, reliable, and easy-to-use video infrastructure services.
            </Text>
          </Box>
          <Box css={{ pt: "$9" }}>
            <TeamSection teamMembers={teamMembers} />
          </Box>
        </Container>
        <Fade key={0}>
          <Prefooter backgroundColor="$panel" />
        </Fade>
      </Box>
    </Layout>
  );
};

export async function getStaticProps() {
  const graphQLClient = new GraphQLClient(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default"
  );

  const data: any = await graphQLClient.request(print(allPages), {
    where: {
      slug: { current: { eq: "team" } },
    },
  });

  return {
    props: {
      ...data.allPage[0],
      preview: false,
    },
    revalidate: 1,
  };
}

export default TeamPage;
