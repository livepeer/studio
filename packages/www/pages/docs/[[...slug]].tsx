import { Container, Grid, Box, global } from "@livepeer.com/design-system";
import DocsNav from "@components/Redesign/Navigation/docs";
import SideNav, { MobileSideNav } from "components/DocsLayout/sideNav";
import { getMdxNode, getMdxPaths, getAllMdxNodes } from "next-mdx/server";
import { useHydrate } from "next-mdx/client";
import { Fragment, useMemo, useState } from "react";
import { docsPositions } from "docs-positions";
import { useRouter } from "next/router";
import { FiList } from "react-icons/fi";
import { CgClose } from "react-icons/cg";
import { NextSeo, NextSeoProps } from "next-seo";
import { GetStaticPathsContext } from "next";
import title from "title";
import { components } from "components/Redesign/MDXComponents";
import { ContextProviders } from "layouts/redesign";

const mobileCategories = [
  {
    name: "Guides",
    slug: "/docs/guides",
  },
  {
    name: "API Reference",
    slug: "/docs/api-reference",
  },
];

const categories = [
  {
    name: "Guides",
    slug: "/docs/guides",
  },
  {
    name: "API Reference",
    slug: "/docs/api-reference",
  },
];

const defaultSEO: NextSeoProps = {
  title: "Docs - Livepeer.com",
  description: "Docs - Livepeer.com",
  openGraph: {
    title: "Docs - Livepeer.com",
    description:
      "The platform built to power video-centric UGC applications at scale.",
    url: "https://livepeer.com/docs",
    images: [
      {
        url: "https://livepeer.com/img/OG.png",
        alt: "Livepeer.com",
        width: 1200,
        height: 642,
      },
    ],
  },
};

const globalStyles = global({
  body: {
    margin: 0,
    backgroundColor: "$loContrast",
    fontFamily: "$untitled",
  },

  "h1, h2, h3, h4, h5": { fontWeight: 500 },

  "body, button": {
    fontFamily: "$untitled",
  },

  svg: { display: "block" },

  "pre, code": { margin: 0, fontFamily: "$mono" },

  "#__next": {
    position: "relative",
    zIndex: 0,
  },

  "#hubspot-messages-iframe-container iframe": {
    colorScheme: "auto",
  },
});

const DocsIndex = ({ doc, menu }) => {
  const [hideTopNav, setHideTopNav] = useState(false);
  const [hideSideBar, setHideSideBar] = useState(false);
  const [mobileSideNavOpen, setMobileSideNavOpen] = useState(false);
  const router = useRouter();

  const currentMenu = useMemo(() => {
    return menu.filter(
      (a) =>
        `/${a.slug}` ===
        router.asPath.split("#")[0].split("/").slice(0, 3).join("/")
    );
  }, [menu, router.asPath]);

  const content = useHydrate(doc, { components });

  const breadCrumb = useMemo(() => {
    return router.asPath.split("#")[0].split("/");
  }, [router.asPath]);

  globalStyles();

  const resolvedSEO: NextSeoProps = useMemo(() => {
    const title = doc.frontMatter.title
      ? `${doc.frontMatter.title} - Livepeer.com`
      : defaultSEO.title;
    const description = doc.frontMatter.description ?? defaultSEO.description;
    const url = `https://livepeer.com${router.asPath}`;
    return {
      ...defaultSEO,
      title,
      description,
      canonical: url,
      openGraph: {
        ...defaultSEO.openGraph,
        title,
        description,
        url,
      },
    };
  }, [router.asPath, doc.frontMatter]);

  return (
    <ContextProviders theme="dark">
      <NextSeo {...resolvedSEO} />
      <Box
        onClick={() => setMobileSideNavOpen(!mobileSideNavOpen)}
        css={{
          display: "flex",
          position: "fixed",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 200,
          right: "16px",
          bottom: "50px",
          background: "black",
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          cursor: "pointer",
          "@bp2": {
            display: "none",
          },
        }}>
        {mobileSideNavOpen ? (
          <CgClose color="white" size={24} />
        ) : (
          <FiList color="white" size={24} />
        )}
      </Box>
      <Box
        css={{
          display: "flex",
          flexDirection: "column",
          gridTemplateColumns: "min-content 1fr",
          gridTemplateRows: "auto auto",
          "@bp2": {
            display: "grid",
          },
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
        <Container size="3">
          <Grid
            css={{
              pt: "$7",
              gridColumn: "1fr",
              justifyItems: "center",
              mx: 0,
              transition: "all 0.2s",
              minWidth: "100%",
              justifyContent: "center",
              alignItems: "flex-start",
            }}>
            <Box
              css={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                maxWidth: 768,
                paddingBottom: 80,
              }}>
              <Box
                css={{
                  display: "flex",
                  alignItems: "center",
                  color: "$hiContrast",
                  fontSize: "$2",
                  letterSpacing: "-0.02em",
                  mb: "16px",
                }}
                className="breadcrumb">
                {breadCrumb.slice(2, 5).map((a, idx) => (
                  <Fragment key={idx}>
                    {title(a.split("-").join(" "))}
                    {idx < breadCrumb.length - 3 && <> / </>}
                  </Fragment>
                ))}
              </Box>
              <Box className="markdown-body">{content}</Box>
            </Box>
          </Grid>
        </Container>
      </Box>
    </ContextProviders>
  );
};

export const getStaticPaths = async () => {
  const paths = await getMdxPaths("doc");
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps = async (context: GetStaticPathsContext) => {
  const posts = await getAllMdxNodes("doc");

  const cleanedDocsPositions = docsPositions.map((a) =>
    a.replace("/index.mdx", "").replace(".mdx", "")
  );

  const allSlugs = posts.map((each) => {
    return {
      slug: `docs${each.slug !== "" ? `/${each.slug}` : ""}`,
      title: each.frontMatter.title,
      description: each.frontMatter.description,
      hide: each.frontMatter?.hide ? true : false,
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
      hide: each.hide,
      children: sorted
        .filter(
          (child) =>
            (child.slug.split("/")[1] === each.slug.split("/")[1] &&
              child.slug.split("/").length == 3) ||
            (child.slug.split("/")[1] === each.slug.split("/")[1] &&
              child.slug.split("/").length === 2)
        )
        .map((eachChild) => {
          return {
            slug: eachChild.slug,
            title: eachChild.title,
            description: eachChild.description,
            hide: eachChild.hide,
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
    components,
    mdxOptions: {
      remarkPlugins: [require("remark-slug")],
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
