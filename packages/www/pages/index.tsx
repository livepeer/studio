import Layout from "layouts/main";
import Prefooter from "@components/Marketing/Prefooter";
import HomeHero from "@components/Marketing/HomeHero";
import Investors from "@components/Marketing/Investors";
import Testimonials from "@components/Marketing/Testimonials";
import Contact from "@components/Marketing/Contact";
import Why from "@components/Marketing/Why";
import { Home as Content } from "content";

const benefitsListItems = [
  {
    icon: {
      provider: "mdi",
      name: "MdMoneyOff",
    },
    title: "Affordable",
    description:
      "Extraordinary cost savings up to 10x less expensive than centralized industry standards.",
  },
  {
    icon: {
      provider: "fi",
      name: "FiUserCheck",
    },
    title: "Accessible",
    description:
      "Straightforward, no nonsense product and documentation designed for developers.",
  },
  {
    icon: {
      provider: "fi",
      name: "FiMove",
    },
    title: "Scalable",
    description:
      "Leverage the near-infinite scalability of the Livepeer Network, rivaling Amazon’s cloud compute.",
  },
  {
    icon: {
      provider: "fi",
      name: "FiSmile",
    },
    title: "Reliable",
    description:
      "An always-on, incentivized network and intelligent distribution guarantees transcoding never stops.",
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
      "Simple and easy to implement APIs that support seamless integration with your streaming platform.",
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
      "Leverage Livepeer's decentralized network of GPUs for AI-assisted content moderation in your streaming platform.",
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
    <Layout {...Content.metaData}>
      <HomeHero />
      <Why
        backgroundColor="$panel"
        title="Benefits"
        heading="Built by developers, for developers, with open software and decentralized infrastructure"
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
