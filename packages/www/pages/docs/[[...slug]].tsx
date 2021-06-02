import globby from "globby";
import { Container, Box } from "@theme-ui/components";
import DocsNav from "components/DocsLayout/nav";
import SideNav from "components/DocsLayout/sideNav";
import { getMdxNode, getMdxPaths, getAllMdxNodes } from "next-mdx/server";
import { useHydrate } from "next-mdx/client";
import { useState } from "react";
import styles from "./docs.module.css";
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

const DocsIndex = ({ doc, menu }) => {
  const [hideTopNav, setHideTopNav] = useState(false);
  const [hideSideBar, setHideSideBar] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(mobileCategories[0]);

  const content = useHydrate(doc, {
    components: components,
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
              paddingBottom: "80px",
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
  const posts = await getAllMdxNodes("doc");

  const allSlugs = posts.map((each) => {
    return {
      slug: each.slug,
      title: each.frontMatter.title,
      description: each.frontMatter.description,
    };
  });

  const routePaths = allSlugs.filter(
    (each) => each.slug.split("/").length == 1
  );

  const menu = routePaths.map((each) => {
    return {
      slug: each.slug,
      title: each.title,
      description: each.description,
      children: allSlugs
        .filter(
          (child) =>
            child.slug.split("/")[0] === each.slug &&
            child.slug.split("/").length == 2
        )
        .map((eachChild) => {
          return {
            slug: eachChild.slug,
            title: eachChild.title,
            description: eachChild.description,
            children: allSlugs.filter(
              (secondChild) =>
                secondChild.slug.split("/")[1] === eachChild.slug.split('/')[1] &&
                secondChild.slug.split("/").length == 3
            ),
          };
        }),
    };
  });

  const doc = await getMdxNode("doc", context, {
    components: components,
    mdxOptions: {
      remarkPlugins: [
        require("remark-slug"),
        require("remark-autolink-headings"),
      ],
    },
  });

  if (!doc) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      doc,
      menu,
    },
  };
};

export default DocsIndex;
