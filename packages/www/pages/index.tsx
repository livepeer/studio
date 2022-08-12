import Layout from "layouts/main";
import { Home as Content } from "content";
import HomeHero from "@components/Site/HomeHero";
import ToolkitSection from "@components/Site/ToolkitSection";
import GuideSection from "@components/Site/GuideSection";
import FeaturedAppsSection from "@components/Site/FeaturedAppsSection";
import PrinciplesSection from "@components/Site/PrinciplesSection";
import { GraphQLClient } from "graphql-request";
import allHome from "../queries/allHome.gql";
import allApps from "../queries/allApps.gql";

import { print } from "graphql/language/printer";

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
  const graphQLClient = new GraphQLClient(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default"
  );

  const id = {
    en: "",
    es: "i18n_es-ES",
  };

  const variables = {
    where: { _id: { matches: id[locale] } },
  };

  let homeData: any = await graphQLClient.request(print(allHome), variables);

  // need to make a separate call for reference documentations to get localized version
  const apps: any = await graphQLClient.request(print(allApps), variables);
  homeData.allHome[0].featuredAppSection.apps = apps.allApp;
  if (locale === "en") {
    homeData.allHome[0].featuredAppSection.apps = apps.allApp.filter(
      (app) => !app._id.includes("__i18n")
    );
  }

  return {
    props: {
      ...homeData.allHome[0],
      preview: false,
    },
    revalidate: 1,
  };
}

HomePage.theme = "dark-theme-blue";
export default HomePage;
