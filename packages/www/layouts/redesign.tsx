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
import { DefaultNav } from "components/Redesign/Navigation";
import Footer from "components/Redesign/Footer";
import ReactGA from "react-ga";
import Router from "next/router";
import { useEffect } from "react";

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
});

interface Props {
  children?: JSX.Element[] | JSX.Element;
  preview?: boolean;
}

function ContextProviders({ children }) {
  return (
    <DesignSystemProvider>
      <ThemeProvider
        disableTransitionOnChange
        attribute="class"
        defaultTheme="system"
        value={{ dark: darkTheme.className, light: lightTheme.className }}>
        <SnackbarProvider>{children}</SnackbarProvider>
      </ThemeProvider>
    </DesignSystemProvider>
  );
}

function Layout({ children, preview }: Props) {
  useEffect(() => {
    ReactGA.pageview(window.location.pathname + window.location.search);
  }, []);

  globalStyles();

  return (
    <ContextProviders>
      <Flex
        css={{
          flexGrow: 1,
          flexDirection: "column",
          justifyContent: "flex-start",
          zIndex: 1,
          position: "relative",
          overflow: "hidden",
        }}>
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
