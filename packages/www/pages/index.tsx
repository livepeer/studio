import Fade from "react-reveal/Fade";
import Layout from "../components/Layout";
import SectionLayout from "../components/SectionLayout";
import IconListItem, { IconListItemProps } from "../components/IconListItem";
import { Grid } from "@theme-ui/components";
import {
  FiUserCheck,
  FiPlay,
  FiZap,
  FiMaximize2,
  FiCode,
  FiPlayCircle,
  FiCheckSquare,
  FiGlobe
} from "react-icons/fi";
import Prefooter from "../components/Prefooter";
import Hero from "../components/HomeHero";
import InvestorsSection from "../components/InvestorsSection";
import TestimonialsSection from "../components/TestimonialsSection";
import ContactSection from "../components/ContactSection";

const benefitsListItems: IconListItemProps[] = [
  {
    icon: <FiUserCheck />,
    title: "Easy to use",
    description:
      "Our straight forward API’s make integrating Livepeer.com into your UGC platform a quick and easy task."
  },
  {
    icon: <FiPlay />,
    title: "Reliable",
    description:
      "Ensure content creator audiences remain engaged by delivering high quality streams with 99.99% reliability."
  },
  {
    icon: <FiMaximize2 />,
    title: "Scalable",
    description:
      "Freedom to scale up or down so you can manage content creator demand without over investing in infrastructure."
  },
  {
    icon: <FiZap />,
    title: "Affordable",
    description:
      "Live Streaming at a fraction of the cost of comparable services."
  }
];

const featuresListItems: IconListItemProps[] = [
  {
    icon: <FiCode />,
    title: "Transcoding",
    description:
      "High quality, reliable transcoding at a cost that makes running a video centric UGC platform with millions of content creators viable."
  },
  {
    icon: <FiPlayCircle />,
    title: "Smart video",
    description:
      "Livepeer.com leverages the GPU processing pipeline in our infrastructure to support content moderation necessary in running UGC platforms."
  },
  {
    icon: <FiCheckSquare />,
    title: "Interactivity",
    description:
      "Key features to enable interactive use cases that drive engagement on UGC platforms including low latency and object detection."
  },
  {
    icon: <FiGlobe />,
    title: "Integration API",
    description:
      "Simple and easy to implement API’s that support seamless integration with your UGC platform."
  }
];

const HomePage = () => {
  return (
    <Layout
      title={`Home - Livepeer.com`}
      description={`The platform built to power video-centric UGC applications at scale.`}
      url={`https://livepeer.com`}
      withGradientBackground
    >
      {/* Do not wrap the <Hero /> in <Fade />. It completely breaks in Safari */}
      <Hero />
      <Fade key={1}>
        <SectionLayout
          heading={{
            title:
              "A platform uniquely tailored to address the needs of today’s video-centric UGC platforms",
            tag: "Benefits",
            cta: {
              isLink: true,
              href: "/register",
              children: "Sign up for free"
            }
          }}
          gradient="colorful"
        >
          <Grid columns={[1, 2]} sx={{ columnGap: 4, rowGap: 5 }}>
            {benefitsListItems.map((item) => (
              <IconListItem
                key={`benefits-list-item-${item.title}`}
                {...item}
              />
            ))}
          </Grid>
        </SectionLayout>
      </Fade>
      <Fade key={2}>
        <SectionLayout
          heading={{
            title:
              "Feature-rich, high quality streaming and on-demand video for your project",
            tag: "Features",
            cta: {
              isLink: true,
              href: "/register",
              children: "Sign up for free"
            }
          }}
        >
          <Grid columns={[1, 2]} sx={{ columnGap: 4, rowGap: 5 }}>
            {featuresListItems.map((item) => (
              <IconListItem
                key={`features-list-item-${item.title}`}
                {...item}
              />
            ))}
          </Grid>
        </SectionLayout>
      </Fade>
      <Fade key={3}>
        <InvestorsSection />
      </Fade>
      <Fade key={4}>
        <TestimonialsSection />
      </Fade>
      <Fade key={5}>
        <ContactSection />
      </Fade>
      <Fade key={6}>
        <Prefooter />
      </Fade>
    </Layout>
  );
};

export default HomePage;
