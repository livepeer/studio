/** @jsx jsx */
import { jsx } from "theme-ui";
import { NextSeo } from "next-seo";
import { DefaultNav } from "@components/Marketing/Navigation";
import Footer from "@components/Marketing/Footer";
import { IdProvider } from "@radix-ui/react-id";
import { Flex, Box } from "@theme-ui/components";
import { useEffect } from "react";
import ReactGA from "react-ga";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";
import Router from "next/router";
import { Reset, ThemeProvider } from "../lib/theme";
import Head from "next/head";
import { ThemeProvider as StitchesThemeProvider } from "next-themes";
import {
  darkTheme,
  lightTheme,
  DesignSystemProvider,
  SnackbarProvider,
} from "@livepeer.com/design-system";
import { hotjar } from "react-hotjar";

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

if (process.env.NODE_ENV === "production") {
  ReactGA.initialize(process.env.NEXT_PUBLIC_GA_TRACKING_ID);
} else {
  ReactGA.initialize("test", { testMode: true });
}

// Track client-side page views with Segment & HubSpot
if (process.env.NODE_ENV === "production") {
  Router.events.on("routeChangeComplete", (url) => {
    window.analytics.page();
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
  useEffect(() => {
    if (window.location.hostname === "livepeer.com") {
      ReactGA.pageview(window.location.pathname + window.location.search);
      hotjar.initialize(2525106, 6);
    }
  }, []);

  let seo = {
    title: title,
    description: description,
    noindex: noindex,
    openGraph: {
      title: title ? title : "Livepeer.com",
      description: description
        ? description
        : "The platform built to power video-centric UGC applications at scale.",
      url: url ? url : "https://livepeer.com",
      images: [
        {
          url: image ? image.url : "https://livepeer.com/img/OG.png",
          alt: image ? image.alt : "Livepeer.com",
          width: 1200,
          height: 642,
        },
      ],
    },
  };

  if (canonical) {
    seo["canonical"] = canonical;
  }

  function ContextProviders({ children }) {
    return (
      <DesignSystemProvider>
        <StitchesThemeProvider
          disableTransitionOnChange
          attribute="class"
          defaultTheme="light"
          value={{ dark: darkTheme.className, light: lightTheme.className }}>
          <SnackbarProvider>{children}</SnackbarProvider>
        </StitchesThemeProvider>
      </DesignSystemProvider>
    );
  }

  return (
    <ContextProviders>
      <IdProvider>
        <Head>
          <link rel="stylesheet" href="/reset.css" />
          <link rel="stylesheet" href="/markdown.css" />
        </Head>
        <ThemeProvider>
          <Reset />
          <Box sx={{ minHeight: "100vh" }}>
            <Flex sx={{ flexDirection: "column", minHeight: "100vh" }}>
              <NextSeo {...seo} />
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
                {customNav ? (
                  customNav
                ) : (
                  <DefaultNav backgroundColor={backgroundColor} />
                )}
                <Box css={{ position: "relative" }}>{children}</Box>
              </Flex>
              <Footer />
            </Flex>
          </Box>
        </ThemeProvider>
      </IdProvider>
    </ContextProviders>
  );
};

export default Layout;
