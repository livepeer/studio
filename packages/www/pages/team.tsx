import Fade from "react-reveal/Fade";
import Layout from "layouts/main";
import { Container, Box, Heading, Text } from "@livepeer/design-system";
import Prefooter from "components/Site/Prefooter";
import TeamSection from "../components/Site/TeamSection";
import { GraphQLClient } from "graphql-request";
import { print } from "graphql/language/printer";
import allPages from "../queries/allPages.gql";
import { Team as PageContent } from "content";
import { getClient } from "lib/sanity.server";
import { groq } from "next-sanity";

const TeamPage = ({ content }) => {
  const [, { teamMembers }] = content;
  return (
    <Layout {...PageContent.metaData}>
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
              We’re building the future of video.
            </Heading>
            <Text variant="gray" size="5">
              We're comprised of team members dedicated to building affordable,
              scalable, reliable, and easy-to-use video developer tools.
            </Text>
          </Box>
          <Box css={{ pt: "$9" }}>
            <TeamSection teamMembers={teamMembers} />
          </Box>
        </Container>
      </Box>
    </Layout>
  );
};

export async function getStaticProps() {
  const client = getClient();
  const query = groq`*[_type=="page" && slug.current == "team"][0]`;
  const pageData = await client.fetch(query);
  // console.log("pageData", pageData);
  // const graphQLClient = new GraphQLClient(
  //   "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default"
  // );

  // const data: any = await graphQLClient.request(print(allPages), {
  //   where: {
  //     slug: { current: { eq: "team" } },
  //   },
  // });

  return {
    props: {
      // ...data.allPage[0],
      ...pageData,
      preview: false,
    },
    revalidate: 1,
  };
}

TeamPage.theme = "dark-theme-blue";
export default TeamPage;
