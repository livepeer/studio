/** @jsx jsx */
import { jsx } from "theme-ui";
import { NextSeo } from "next-seo";
import { DefaultNav } from "../components/Navigation";
import Footer from "../components/Footer";
import { IdProvider } from "@radix-ui/react-id";
import { Flex, Box } from "@theme-ui/components";
import { useEffect } from "react";
import ReactGA from "react-ga";
import "lazysizes";
import "lazysizes/plugins/attrchange/ls.attrchange";
import Router from "next/router";
import GradientBackgroundBox from "../components/GradientBackgroundBox";
import { Reset, ThemeProvider } from "../lib/theme";
import MarkdownProvider from "../lib/markdown-provider";
// import "../css/reset.css";
// import "../css/markdown.css";
// import "keen-slider/keen-slider.min.css";

interface Props {
  title?: string;
  children?: JSX.Element[] | JSX.Element;
  description?: string;
  image?: any;
  url?: string;
  canonical?: string;
  noindex?: boolean;
  preview?: boolean;
  withGradientBackground?: boolean;
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
  withGradientBackground,
  customNav,
}: Props) => {
  useEffect(() => {
    ReactGA.pageview(window.location.pathname + window.location.search);
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
          url: image ? image.url : "https://livepeer.com/img/share-icon.png",
          alt: image ? image.alt : "Livepeer.com",
        },
      ],
    },
  };

  if (canonical) {
    seo["canonical"] = canonical;
  }

  return (
    <IdProvider>
      <ThemeProvider>
        <MarkdownProvider>
          <Reset />
          <Box sx={{ minHeight: "100vh" }}>
            <Flex sx={{ flexDirection: "column", minHeight: "100vh" }}>
              <NextSeo {...seo} />
              {withGradientBackground && (
                <div
                  sx={{
                    position: "absolute",
                    top: 0,
                    width: "100%",
                    pointerEvents: "none",
                    zIndex: 0,
                  }}>
                  <GradientBackgroundBox
                    id="layout"
                    gradient="violet"
                    sx={{ height: "1000px" }}
                    slide
                  />
                </div>
              )}
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
                {customNav ? customNav : <DefaultNav />}
                {children}
              </Flex>
              <Footer />
            </Flex>
          </Box>
        </MarkdownProvider>
      </ThemeProvider>
    </IdProvider>
  );
};

export default Layout;
