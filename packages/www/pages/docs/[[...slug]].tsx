import globby from "globby";
import { Container, Box } from "@theme-ui/components";
import DocsNav from "components/DocsLayout/nav";
import SideNav from "components/DocsLayout/sideNav";
import { getMdxNode, getMdxPaths } from "next-mdx/server";
import { getTableOfContents, TableOfContents } from "next-mdx-toc";
import { useHydrate } from "next-mdx/client";
import { useState } from "react";
import styles from './docs.module.css'
import {
  NavigationCard,
  DocsPost,
  SimpleCard,
  DocsGrid,
} from "components/DocsLayout/helpers";
import {
  IconApiReference,
  IconHouse,
  IconVideoGuides,
} from "components/DocsLayout/icons";
import { Heading } from "@theme-ui/components";
import Link from "next/link";

const mobileCategories = [
  {
    name: "Homepage",
    icon: <IconHouse id="mobileHouse" />,
  },
  {
    name: "Video Guides",
    icon: <IconVideoGuides id="mobileVideoGuides" />,
  },
  {
    name: "API Reference",
    icon: <IconApiReference id="mobileApiReference" />,
  },
];

const categories = [
  {
    name: "Homepage",
    icon: <IconHouse />,
  },
  {
    name: "Video Guides",
    icon: <IconVideoGuides />,
  },
  {
    name: "API Reference",
    icon: <IconApiReference />,
  },
];

const components = {
  h1: ({ children }) => {
    return <Heading as="h1">{children}</Heading>;
  },
  h2: ({ children }) => {
    return <Heading as="h2">{children}</Heading>;
  },
  h3: ({ children }) => {
    return <Heading as="h3">{children}</Heading>;
  },
  a: ({ children, href }) => {
    return (
      <Link href={href} passHref>
        <a>{children}</a>
      </Link>
    );
  },
  NavigationCard,
  DocsPost,
  SimpleCard,
  DocsGrid,
};

const DocsIndex = ({ doc, toc }) => {
  const [hideTopNav, setHideTopNav] = useState(false);
  const [hideSideBar, setHideSideBar] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(mobileCategories[0]);

  const content = useHydrate(doc, {
    components: components
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <DocsNav
        hideTopNav={hideTopNav}
        setHideTopNav={setHideTopNav}
        currentCategory={currentCategory}
        setCurrentCategory={setCurrentCategory}
        categories={categories}
        mobileCategories={mobileCategories}
      />
      <div
        sx={{
          display: "flex",
          position: "sticky",
          top: hideTopNav ? "76px" : "136px",
        }}>
        <div
          sx={{
            transition: "all 0.2s",
          }}>
          <SideNav
            hideTopNav={hideTopNav}
            hideSideBar={hideSideBar}
            setHideSideBar={setHideSideBar}
          />
        </div>
        <Container
          sx={{
            mt: hideTopNav ? "-12px" : "48px",
            mx: 0,
            transition: "all 0.2s",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
          }}>
          <div
            className={styles.markdown}
            sx={{
              display: "flex",
              flexDirection: "column",
              maxWidth: "768px",
              paddingBottom: '80px'
            }}>
            {content}
          </div>
        </Container>
      </div>
    </Box>
  );
};

export const getStaticPaths = async () => {
  const paths = await getMdxPaths("doc");
  const realPaths = paths.map((a) => a.params.slug[0]);
  return {
    paths: paths,
    fallback: false,
  };
};

export const getStaticProps = async (context) => {
  const filePaths = await globby(["docs/**/*"]);
  const doc = await getMdxNode("doc", context, {
    components: components,
  });

  if (!doc) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      doc,
      toc: await getTableOfContents(doc),
    },
  };
};

export default DocsIndex;
