import Layout from "layouts/main";
import Prefooter from "components/Site/Prefooter";
import HomeHero from "components/Site/HomeHero";
import Why from "components/Site/Why";
import OneAPI from "components/Site/OneAPI";
import { Home as Content } from "content";
import Link from "next/link";
import { Button, Box, Link as A } from "@livepeer/design-system";
import { FiArrowUpRight } from "react-icons/fi";
import Ripe, { categories, pages } from "lib/ripe";

const networkFeatures = [
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
      "Livepeer Studio harnesses the power the Livepeer Network, drawing a global network of providers to process and deliver video, enabling near-infinite scalability.",
  },
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

const benefits = [
  {
    icon: {
      provider: "fi",
      name: "FiMove",
    },
    title: "Scalable",
    description:
      "Livepeer Studio harnesses the power of the Livepeer Network, drawing a global network of providers to process and deliver video and enabling near-infinite scalability.",
  },
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
    title: "Performance",
    description:
      "Deliver high-quality video at astonishing speeds by leveraging the Livepeer Network's highly competitive infrastructure providers.",
  },
  {
    icon: {
      provider: "fi",
      name: "FiGlobe",
    },
    title: "Open",
    description:
      "Livepeer Studio runs on open source software. Tap into a worldwide network of Livepeer experts committed to driving value and solutions.",
  },
];

const HomePage = () => {
  return (
    <Layout {...Content.metaData}>
      <HomeHero />
      <Why
        backgroundColor="$neutral2"
        title="Why Livepeer Studio"
        heading={<Box>A better way for developers to stream video</Box>}
        reasons={benefits}
      />
      <OneAPI />
      <Why
        alignment="center"
        backgroundColor="$neutral2"
        heading="Powered by the Livepeer Network"
        description={
          <Box>
            Livepeer Studio doesn't use traditional cloud infrastructure, and it
            doesn't own or operate any GPUs. Instead, it's built on the{" "}
            <A href="https://livepeer.org" target="_blank">
              Livepeer Network
            </A>
            , an open and distributed global network that enables superior cost,
            performance, and reliability.
          </Box>
        }
        ctas={[
          {
            title: "Learn more",
            href: "https://livepeer.org/primer",
            isExternal: true,
          },
        ]}
      />
      {/* 
      <Investors backgroundColor="rgb(30 30 33)" />
      <Testimonials /> */}

      {/* <Contact backgroundColor="$panel" /> */}
      <Prefooter />
    </Layout>
  );
};

HomePage.theme = "light-theme-green";
export default HomePage;
