import { Home as Content } from "content";
import { CenterTitle } from "@components/Site/CenterTitle";
import { HeroImage } from "@components/Site/HeroImage";
import { OffsetPortableText } from "@components/Site/OffsetPortableText";
import { IconGrid } from "@components/Site/IconGrid";
import Layout from "layouts/main";

const CaseSudy = () => {
  return (
    <Layout navBackgroundColor="$hiContrast" {...Content.metaData}>
      <HeroImage />
      <OffsetPortableText />
      <CenterTitle />
      <IconGrid />
    </Layout>
  );
};

export default CaseSudy;
