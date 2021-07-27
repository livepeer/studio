import Layout from "../layouts";
import Prefooter from "components/Redesign/Prefooter";
import Hero from "components/Redesign/HomeHero";
import Investors from "components/Redesign/Investors";
import Testimonials from "components/Redesign/Testimonials";
import Contact from "components/Redesign/Contact";
import Why from "components/Redesign/Why";

const benefitsListItems = [
  {
    icon: {
      provider: "fi",
      name: "FiUserCheck",
    },
    title: "Easy to use",
    description:
      "Our straight forward API’s make integrating Livepeer.com into your UGC platform a quick and easy task.",
  },
  {
    icon: {
      provider: "fi",
      name: "FiSmile",
    },
    title: "Reliable",
    description:
      "Ensure content creator audiences remain engaged by delivering high quality streams with 99.99% reliability.",
  },
  {
    icon: {
      provider: "fi",
      name: "FiMove",
    },
    title: "Scalable",
    description:
      "Freedom to scale up or down so you can manage content creator demand without over investing in infrastructure.",
  },
  {
    icon: {
      provider: "mdi",
      name: "MdMoneyOff",
    },
    title: "Affordable",
    description:
      "Live Streaming at a fraction of the cost of comparable services.",
  },
];

const featuresListItems = [
  {
    icon: {
      provider: "fi",
      name: "FiCode",
    },
    title: "Easy-to-use API",
    description:
      "Simple and easy to implement API’s that support seamless integration with your UGC platform.",
  },
  {
    icon: {
      provider: "fa",
      name: "FaPhotoVideo",
    },
    title: "Affordable transcoding",
    description:
      "High quality, reliable transcoding at a cost that makes running a video centric UGC platform with millions of content creators viable.",
  },
  {
    icon: {
      provider: "fa",
      name: "FaRobot",
    },
    title: "Smart video",
    description:
      "Livepeer.com leverages the GPU processing pipeline in our infrastructure to support content moderation necessary in running UGC platforms.",
  },
  {
    icon: {
      provider: "mdi",
      name: "MdLocationSearching",
    },
    title: "Interactivity",
    description:
      "Key features to enable interactive use cases that drive engagement on UGC platforms including low latency and object detection.",
  },
];

const HomePage = () => {
  return (
    <Layout
      title={`Home - Livepeer.com`}
      description={`The platform built to power video-centric UGC applications at scale.`}
      url={`https://livepeer.com`}>
      <Hero />
      <Why
        title="Benefits"
        heading="A platform uniquely tailored to address the needs of today’s streaming platforms."
        reasons={benefitsListItems}
      />
      <Why
        title="Features"
        backgroundColor="$loContrast"
        heading="Feature-rich, high quality streaming and on-demand video for your project."
        reasons={featuresListItems}
      />

      <Investors />
      <Testimonials />
      <Contact />
      <Prefooter />
    </Layout>
  );
};

export default HomePage;
