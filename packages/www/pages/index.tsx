import Layout from "layouts/main";
import { Home as Content } from "content";
import HomeHero from "components/Site/HomeHero";
import ToolkitSection from "components/Site/ToolkitSection";
import GuideSection from "components/Site/GuideSection";
import FeaturedAppsSection from "components/Site/FeaturedAppsSection";
import PrinciplesSection from "components/Site/PrinciplesSection";
import { getClient } from "lib/sanity.server";
import { groq } from "next-sanity";

const HomePage = (props) => {
  return (
    <Layout navBackgroundColor="$hiContrast" {...Content.metaData}>
      <HomeHero content={props.heroSection} />
      <ToolkitSection content={props.toolkitSection} />
      <GuideSection content={props.guideSection} />
      <FeaturedAppsSection content={props.featuredAppSection} />
      <PrinciplesSection content={props.principlesSection} />
    </Layout>
  );
};

export async function getStaticProps({ locale }) {
  const client = getClient();
  const queryParams = {};
  const query = groq`*[_type=="home" && __i18n_lang =='en-US'][0]`;
  const pageData = await client.fetch(query, queryParams);
  console.log("data: ", pageData);
  // const graphQLClient = new GraphQLClient(
  //   "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default"
  // );

  // const id = {
  //   en: "",
  //   es: "i18n_es-ES",
  // };

  // const variables = {
  //   where: { _id: { matches: id[locale] } },
  // };

  // let data: any = await graphQLClient.request(print(allHome), variables);
  // console.log("gql data: ", data);
  return {
    props: {
      // ...data.allHome[0],
      ...pageData,
      preview: false,
    },
    revalidate: 1,
  };
}

HomePage.theme = "dark-theme-blue";
export default HomePage;
