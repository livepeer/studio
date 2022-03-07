import { ThemeProvider } from "next-themes";
import {
  global,
  darkTheme,
  lightTheme,
  DesignSystemProvider,
  Flex,
  Box,
  SnackbarProvider,
} from "@livepeer.com/design-system";
import { DefaultNav } from "@components/Marketing/Navigation";
import Footer from "@components/Marketing/Footer";
import ReactGA from "react-ga";
import Router from "next/router";
import { useEffect } from "react";
import { NextSeo } from "next-seo";
import { hotjar } from "react-hotjar";

const DEFAULT_THEME = "system";

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

const globalStyles = global({
  body: {
    margin: 0,
    backgroundColor: "$loContrast",
    fontFamily: "$untitled",
    color: "$hiContrast",
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
  css: Record<string, any>;
}

export function ContextProviders({ theme = DEFAULT_THEME, children }) {
  return (
    <DesignSystemProvider>
      <ThemeProvider
        disableTransitionOnChange
        attribute="class"
        defaultTheme={theme}
        value={{ dark: darkTheme.className, light: lightTheme.className }}>
        <SnackbarProvider>{children}</SnackbarProvider>
      </ThemeProvider>
    </DesignSystemProvider>
  );
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
}: Props) {
  useEffect(() => {
    if (window.location.hostname === "livepeer.com") {
      ReactGA.pageview(window.location.pathname + window.location.search);
      hotjar.initialize(2525106, 6);
    }
  }, []);

  globalStyles();

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

  return (
    <ContextProviders theme={theme}>
      <Flex
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
              backgroundColor: "$violet9",
              color: "white",
              lineHeight: "32px",
            }}>
            Preview Mode
          </Box>
        )}
        <DefaultNav />
        {children}
        <Footer />
      </Flex>
    </ContextProviders>
  );
}

export default Layout;
