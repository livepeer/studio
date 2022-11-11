import { Flex, Box } from "@livepeer/design-system";
import { DefaultNav } from "components/Site/Navigation";
import Footer from "components/Site/Footer";
import ReactGA from "react-ga";
import Router from "next/router";
import { useEffect } from "react";
import { NextSeo } from "next-seo";
import { hotjar } from "react-hotjar";
import { DEFAULT_THEME } from "lib/theme";

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

interface Props {
  title?: string;
  children?: JSX.Element[] | JSX.Element;
  description?: string;
  image?: any;
  url?: string;
  canonical?: string;
  noindex?: boolean;
  preview?: boolean;
  theme?: string;
  navBackgroundColor?: string;
  css?: Record<string, any>;
  globalData?: any;
}

function Layout({
  title,
  description,
  children,
  image,
  url,
  canonical,
  theme = DEFAULT_THEME,
  noindex = false,
  preview = false,
  css = {},
  navBackgroundColor = "transparent",
}: Props) {
  useEffect(() => {
    if (window.location.hostname === "livepeer.studio") {
      ReactGA.pageview(window.location.pathname + window.location.search);
      hotjar.initialize(2525106, 6);
    }
  }, []);

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
          url: image ? image.url : "https://livepeer.studio/img/OG.png",
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
    <Flex
      className="main"
      css={{
        flexGrow: 1,
        flexDirection: "column",
        justifyContent: "flex-start",
        zIndex: 1,
        position: "relative",
        ...css,
      }}>
      <NextSeo {...seo} />
      {preview && (
        <Box
          css={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 24,
            fontSize: 12,
            fontWeight: 500,
            backgroundColor: "$blue9",
            color: "white",
            lineHeight: "32px",
          }}>
          Preview Mode
        </Box>
      )}
      <DefaultNav navBackgroundColor={navBackgroundColor} />
      {children}
      <Footer />
    </Flex>
  );
}

export default Layout;
