import Layout from "../layouts/redesign";
import Prefooter from "@components/Marketing/Prefooter";
import Hero from "@components/Marketing/HomeHero";
import Investors from "@components/Marketing/Investors";
import Testimonials from "@components/Marketing/Testimonials";
import Contact from "@components/Marketing/Contact";
import Why from "@components/Marketing/Why";

const benefitsListItems = [
  {
    icon: {
      provider: "fi",
      name: "FiUserCheck",
    },
    title: "Easy to use",
    description:
      "Our straight forward API’s make integrating Livepeer.com into your streaming platform a quick and easy task.",
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
      "Simple and easy to implement API’s that support seamless integration with your streaming platform.",
  },
  {
    icon: {
      provider: "fa",
      name: "FaPhotoVideo",
    },
    title: "Affordable transcoding",
    description:
      "High quality, reliable transcoding at a cost that makes running a video centric streaming platform with millions of content creators viable.",
  },
  {
    icon: {
      provider: "fa",
      name: "FaRobot",
    },
    title: "Smart video",
    description:
      "Livepeer.com leverages the GPU processing pipeline in our infrastructure to support content moderation necessary in running streaming platforms.",
  },
  {
    icon: {
      provider: "mdi",
      name: "MdLocationSearching",
    },
    title: "Interactivity",
    description:
      "Key features to enable interactive use cases that drive engagement on streaming platforms including low latency and object detection.",
  },
];

const HomePage = () => {
  return (
    <Layout
      title={`Home - Livepeer.com`}
      description={`The world’s most affordable, powerful and easy-to-use video streaming API, powered by Livepeer.`}
      url={`https://livepeer.com`}>
      <Hero />
      <Why
        backgroundColor="$panel"
        title="Benefits"
        heading="An API uniquely tailored to address the needs of today’s streaming platforms."
        reasons={benefitsListItems}
      />
      <Why
        title="Features"
        heading="Feature-rich, high quality streaming for your project."
        reasons={featuresListItems}
      />

      <Investors backgroundColor="rgb(30 30 33)" />
      <Testimonials />
      <Contact />
      <Prefooter />
    </Layout>
  );
};

export default HomePage;
