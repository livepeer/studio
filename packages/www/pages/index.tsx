import Layout from "layouts/main";
import { Home as Content } from "content";
import HomeHero from "@components/Site/HomeHero";
import ToolkitSection from "@components/Site/ToolkitSection";
import GuideSection from "@components/Site/GuideSection";
import FeaturedAppsSection from "@components/Site/FeaturedAppsSection";
import PrinciplesSection from "@components/Site/PrinciplesSection";

const HomePage = () => {
  return (
    <Layout navBackgroundColor="$hiContrast" {...Content.metaData}>
      <HomeHero />
      <ToolkitSection />
      <GuideSection />
      <FeaturedAppsSection />
      <PrinciplesSection />
    </Layout>
  );
};

HomePage.theme = "dark-theme-blue";
export default HomePage;
