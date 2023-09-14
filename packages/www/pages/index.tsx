import Layout from "layouts/main";
import Prefooter from "components/Site/Prefooter";
import HomeHero from "components/Site/HomeHero";
import Contact from "components/Site/Contact";
import Why from "components/Site/Why";
import OneAPI from "components/Site/OneAPI";
import { Home as Content } from "content";
import Link from "next/link";
import { Box, Link as A } from "@livepeer/design-system";

const benefitsListItems = [
  {
    icon: {
      provider: "mdi",
      name: "MdMoneyOff",
    },
    title: "Affordable",
    description: (
      <Box>
        Save up to 90% on costs with{" "}
        <Link href="/pricing" passHref legacyBehavior>
          <A variant="primary">streamlined pricing</A>
        </Link>{" "}
        that takes advantage of the Livepeer Network's open marketplace of
        infrastructure providers representing access to 70k+ GPUs.
      </Box>
    ),
  },
  {
    icon: {
      provider: "fi",
      name: "FiSmile",
    },
    title: "Easy-to-use",
    description:
      "The Livepeer API untangles the intricate web of video infrastructure workflows, offering developers one unified and intuitive API that can fulfill all video application requirements.",
  },
  {
    icon: {
      provider: "fi",
      name: "FiMove",
    },
    title: "Scalable",
    description:
      "The Livepeer Network harnesses the power of cryptoeconomic incentives, drawing a global network of providers to process and deliver video, enabling near-infinite scalability.",
  },
  {
    icon: {
      provider: "mdi",
      name: "MdVerified",
    },
    title: "Reliable",
    description:
      "An always-on, incentivized network and intelligent distribution keeps your application’s video streams flowing 24/7.",
  },
  {
    icon: {
      provider: "mdi",
      name: "MdBolt",
    },
    title: "Performant",
    description:
      "Deliver outstanding performance by leveraging the network's highly competitive infrastructure providers transmitting high-quality video at astonishing speeds.",
  },
  {
    icon: {
      provider: "fi",
      name: "FiGlobe",
    },
    title: "Open",
    description:
      "The Livepeer Network runs on open source software. Tap into a worldwide network of Livepeer experts committed to driving value and solutions.",
  },
];

const HomePage = () => {
  return (
    <Layout {...Content.metaData}>
      <HomeHero />
      <OneAPI backgroundColor="$neutral2" />
      <Why
        heading="Powered by the Livepeer Network"
        description={
          <Box>
            What makes Livepeer Studio so scalable, reliable, and affordable?
            It's powered by the{" "}
            <A variant="primary" href="https://livepeer.org" target="_blank">
              Livepeer Network
            </A>
            , an open and permissionless peer-to-peer network of independent
            operators intelligently routing and processing video.
          </Box>
        }
        reasons={benefitsListItems}
      />
      {/* 
      <Investors backgroundColor="rgb(30 30 33)" />
      <Testimonials /> */}

      {/* <Contact backgroundColor="$panel" /> */}
      <Prefooter />
    </Layout>
  );
};

export default HomePage;
