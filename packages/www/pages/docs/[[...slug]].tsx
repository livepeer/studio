import { Container, Box } from "@theme-ui/components";
import DocsNav from "components/DocsLayout/nav";
import SideNav, { MobileSideNav } from "components/DocsLayout/sideNav";
import { getMdxNode, getMdxPaths, getAllMdxNodes } from "next-mdx/server";
import { useHydrate } from "next-mdx/client";
import { useState } from "react";
import { docsPositions } from "docs-positions";
import styles from "./docs.module.css";
import {
  NavigationCard,
  DocsPost,
  SimpleCard,
  DocsGrid,
  Heading,
} from "components/DocsLayout/helpers";
import Link from "next/link";
import { useRouter } from "next/router";
import { IconApiReference, IconVideoGuides } from "components/DocsLayout/icons";
import { FiList } from "react-icons/fi";
import { CgClose } from "react-icons/cg";
import Code from "components/renderers/Code";
import { NextSeo } from "next-seo";

const mobileCategories = [
  {
    name: "Video Guides",
    icon: <IconVideoGuides id="mobileVideoGuides" />,
    slug: "/docs/video-guides",
  },
  {
    name: "API Reference",
    icon: <IconApiReference id="mobileApiReference" />,
    slug: "/docs/api-reference",
  },
];

const categories = [
  {
    name: "Video Guides",
    icon: <IconVideoGuides />,
    slug: "/docs/video-guides",
  },
  {
    name: "API Reference",
    icon: <IconApiReference />,
    slug: "/docs/api-reference",
  },
];

const components = {
  h1: ({ children }) => {
    return <Heading as="h1">{children}</Heading>;
  },
  h2: ({ children }) => {
    return <Heading as="h3">{children}</Heading>;
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
  code: ({ children }) => {
    return (
      // @ts-ignore
      <Code custom language="json">
        {children}
      </Code>
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
  const [mobileSideNavOpen, setMobileSideNavOpen] = useState(false);
  const router = useRouter();

  const currentMenu = menu.filter(
    (a) => `/${a.slug}` === router.asPath.split('#')[0].split("/").slice(0, 3).join("/")
  );

  const content = useHydrate(doc, {
    components: components,
  });

  const breadCrumb = router.asPath.split("#")[0].split("/");

  let seo = {
    title: "Docs - Livepeer.com",
    description: "Docs - Livepeer.com",
    openGraph: {
      title: "Docs - Livepeer.com",
      description:
        "The platform built to power video-centric UGC applications at scale.",
      url: "https://livepeer.com/docs",
      images: [
        {
          url: "https://livepeer.com/img/share-icon.png",
          alt: "Livepeer.com",
        },
      ],
    },
  };

  return (
    <>
      <NextSeo {...seo} />
      <div
        onClick={() => setMobileSideNavOpen(!mobileSideNavOpen)}
        sx={{
          display: ["flex", "flex", "none", "none"],
          position: "fixed",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 200,
          right: "16px",
          bottom: "80px",
          background: "black",
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          cursor: "pointer",
        }}>
        {mobileSideNavOpen ? (
          <CgClose color="white" size={24} />
        ) : (
          <FiList color="white" size={24} />
        )}
      </div>
      <Box
        sx={{
          display: ["flex", "flex", "grid", "grid"],
          flexDirection: "column",
          gridTemplateColumns: ["min-content 1fr"],
          gridTemplateRows: "auto auto",
        }}>
        <DocsNav
          hideTopNav={hideTopNav}
          setHideTopNav={setHideTopNav}
          categories={categories}
          mobileCategories={mobileCategories}
        />
        <SideNav
          menu={currentMenu}
          hideTopNav={hideTopNav}
          hideSideBar={hideSideBar}
          setHideSideBar={setHideSideBar}
        />
        <MobileSideNav
          isOpen={mobileSideNavOpen}
          menu={currentMenu}
          setIsOpen={setMobileSideNavOpen}
        />
        <Container
          sx={{
            mt: hideTopNav ? "-12px" : "48px",
            gridColumn: "1fr",
            justifyItems: "center",
            mx: 0,
            transition: "all 0.2s",
            display: "flex",
            minWidth: "100%",
            justifyContent: "center",
            alignItems: "flex-start",
          }}>
          <div
            className={styles.markdown}
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              maxWidth: "768px",
              paddingBottom: "80px",
            }}>
            <div
              sx={{
                display: "flex",
                alignItems: "center",
                color: "#202020",
                fontSize: "12px",
                letterSpacing: "-0.02em",
                mb: "16px",
              }}>
              {breadCrumb.slice(2, 5).map((a, idx) => (
                <div key={idx} sx={{ display: "flex", alignItems: "center" }}>
                  <span sx={{ textTransform: "capitalize" }}>
                    {a.split("-").join(" ")}
                  </span>
                  {idx < breadCrumb.length - 3 && (
                    <span sx={{ mx: "6px" }}>/</span>
                  )}
                </div>
              ))}
            </div>
            {content}
          </div>
        </Container>
      </Box>
    </>
  );
};

export const getStaticPaths = async () => {
  const paths = await getMdxPaths("doc");
  return {
    paths: paths,
    fallback: false,
  };
};

export const getStaticProps = async (context) => {
  const posts = await getAllMdxNodes("doc");

  const cleanedDocsPositions = docsPositions.map((a) =>
    a.replace("/index.mdx", "").replace(".mdx", "")
  );

  const allSlugs = posts.map((each) => {
    return {
      slug: `docs${each.slug !== "" ? `/${each.slug}` : ""}`,
      title: each.frontMatter.title,
      description: each.frontMatter.description,
    };
  });

  const sorted = allSlugs.sort((a, b) => {
    return (
      cleanedDocsPositions.indexOf(a.slug) -
      cleanedDocsPositions.indexOf(b.slug)
    );
  });

  
  const routePaths = sorted.filter((each) => each.slug.split("/").length <= 2);

  const menu = routePaths.map((each) => {
    return {
      slug: each.slug,
      title: each.title,
      description: each.description,
      children: sorted
        .filter(
          (child) =>
            child.slug.split("/")[1] === each.slug.split("/")[1] &&
            child.slug.split("/").length == 3 || child.slug.split("/")[1] === each.slug.split("/")[1] &&
            child.slug.split("/").length === 2
        )
        .map((eachChild) => {
          return {
            slug: eachChild.slug,
            title: eachChild.title,
            description: eachChild.description,
            children: sorted.filter(
              (secondChild) =>
                secondChild.slug.split("/")[2] ===
                  eachChild.slug.split("/")[2] &&
                secondChild.slug.split("/").length == 4
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
