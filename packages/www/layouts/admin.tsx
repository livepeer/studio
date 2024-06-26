/** @jsxImportSource @emotion/react */
import { jsx } from "theme-ui";
import { NextSeo } from "next-seo";
import { withEmailVerifyMode } from "./withEmailVerifyMode";
import { Flex, Box } from "@theme-ui/components";
import { useEffect } from "react";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";
import Router from "next/router";
import { Reset, ThemeProvider } from "../lib/theme";
import Head from "next/head";
import { hotjar } from "react-hotjar";
import { isExport } from "lib/utils";

interface Props {
  title?: string;
  children?: JSX.Element[] | JSX.Element;
  description?: string;
  image?: any;
  url?: string;
  canonical?: string;
  noindex?: boolean;
  preview?: boolean;
  backgroundColor?: string;
  customNav?: React.ReactNode;
}

// Track client-side page views with Segment & HubSpot
if (process.env.NODE_ENV === "production") {
  Router.events.on("routeChangeComplete", (url) => {
    window.analytics && window.analytics.page();
    var _hsq = (window["hsq"] = window["hsq"] || []);
    _hsq.push(["setPath", url]);
    _hsq.push(["trackPageView"]);
  });
}

const Layout = ({
  title,
  description,
  children,
  image,
  url,
  canonical,
  noindex = false,
  preview = false,
  backgroundColor = "$loContrast",
  customNav,
}: Props) => {
  let seo = {
    title,
    description,
    noindex,
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: image ? image.url : "https://assets.livepeer.studio/api/og",
          alt: image ? image.alt : "Livepeer Studio",
          width: 1200,
          height: 642,
        },
      ],
    },
  };

  if (canonical) {
    seo["canonical"] = canonical;
  }

  return (
    <>
      <Head>
        <link rel="stylesheet" href="/reset.css" />
        <link rel="stylesheet" href="/markdown.css" />
      </Head>
      <ThemeProvider>
        <Reset />
        <Box sx={{ minHeight: "100vh" }}>
          <Flex sx={{ flexDirection: "column", minHeight: "100vh" }}>
            {!isExport() && <NextSeo {...seo} />}
            <Flex
              sx={{
                flexGrow: 1,
                flexDirection: "column",
                justifyContent: "flex-start",
                zIndex: 1,
                position: "relative",
              }}>
              {preview && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    textDecoration: "none",
                    justifyContent: "center",
                    height: 24,
                    fontSize: 12,
                    fontWeight: "500",
                    bg: "primary",
                    color: "white",
                    lineHeight: "32px",
                  }}>
                  Preview Mode
                </Box>
              )}
              <Box css={{ position: "relative" }}>{children}</Box>
            </Flex>
          </Flex>
        </Box>
      </ThemeProvider>
    </>
  );
};

export default withEmailVerifyMode(Layout);
