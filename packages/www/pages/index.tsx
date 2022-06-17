import Layout from "layouts/main";
import { Home as Content } from "content";
import HomeHero from "@components/Marketing/HomeHero";
import ToolkitSection from "@components/Marketing/ToolkitSection";
import GuideSection from "@components/Marketing/GuideSection";
import FeaturedAppsSection from "@components/Marketing/FeaturedAppsSection";
import PrinciplesSection from "@components/Marketing/PrinciplesSection";

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

HomePage.theme = "dark-theme-indigo";
export default HomePage;
