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
      "Leverage the near-infinite scalability of the Livepeer network, rivaling Amazon’s cloud compute.",
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
    title: "Streaming API",
    description:
      "One API for your video streaming needs. Configure details for live broadcasting software, generate a playback URL, get usage data for stream sessions, and more.",
  },
  {
    icon: {
      provider: "fa",
      name: "FaPhotoVideo",
    },
    title: "Always-on transcoding",
    description:
      "Tap into Livepeer’s superpower: a decentralized network of always-on, incentivized transcoding providers around the globe. Expect zero boot-up latency for every API request.",
  },
  {
    icon: {
      provider: "fa",
      name: "FaToolbox",
    },
    title: "Best in class compatibility",
    description:
      "MistServer, Livepeer’s open source media server, enables you to ingest any video stream or file and deliver it to any device. Create the consistent viewing experience your audience expects.",
  },
  {
    icon: {
      provider: "fi",
      name: "FiTool",
    },
    title: "Web3 video toolkit",
    description:
      "Livepeer is building the chain-agnostic video infrastructure layer for Web3 apps — from live broadcast and the creator economy to metaverse and video NFTs.",
  },
];

const HomePage = () => {
  return (
    <Layout {...Content.metaData}>
      <HomeHero />
      <Why
        backgroundColor="$panel"
        title="Benefits"
        heading="Built for developers, by developers, with open software and decentralized infrastructure"
        reasons={benefitsListItems}
      />
      <Why
        title="Features"
        heading="The necessary infrastructure and software for any video streaming app, at a fraction of the cost"
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
