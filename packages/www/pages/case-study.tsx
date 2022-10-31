import { Home as Content } from "content";
import CenterTitle from "@components/Site/CenterTitle";
import HeroImage from "@components/Site/HeroImage";
import OffsetPortableText from "@components/Site/OffsetPortableText";
import IconGrid from "@components/Site/IconGrid";
import Layout from "layouts/main";
import SplitImage from "@components/Site/SplitImage";
import Form from "@components/Site/Form";

const CaseSudy = () => {
  return (
    <Layout navBackgroundColor="$hiContrast" {...Content.metaData}>
      <HeroImage />
      <OffsetPortableText />
      <IconGrid noTitle={true} />
      <CenterTitle />
      <SplitImage direction={true} />
      <SplitImage direction={false} />
      <SplitImage direction={true} />
      <SplitImage direction={false} />
      <IconGrid noTitle={false} />
      <Form />
    </Layout>
  );
};

export default CaseSudy;
