import dynamic from "next/dynamic";
import { Home as Content } from "content";

const Layout = dynamic(() => import("layouts/main"));
const Prefooter = dynamic(() => import("@components/Marketing/Prefooter"));
const HomeHero = dynamic(() => import("@components/Marketing/HomeHero"));
const Investors = dynamic(() => import("@components/Marketing/Investors"));
const Testimonials = dynamic(
  () => import("@components/Marketing/Testimonials")
);
const Contact = dynamic(() => import("@components/Marketing/Contact"));
const Why = dynamic(() => import("@components/Marketing/Why"));

const benefitsListItems = [
  {
    icon: {
      provider: "fi",
      name: "FiUserCheck",
    },
    title: "Easy to use",
    description:
      "Our straight forward APIs make integrating your streaming platform with the Livepeer network a quick and easy task.",
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
