import Head from "next/head";
import { DefaultSeo } from "next-seo";
import SEO from "../next-seo.config";
import { ApiProvider } from "hooks/use-api";
import { AnalyzerProvider } from "hooks/use-analyzer";
import { QueryClient, QueryClientProvider } from "react-query";
import { MetaMaskProvider } from "metamask-react";
import React from "react";
import { Theme } from "@radix-ui/themes";
import {
  globalCss,
  getThemes,
  SnackbarProvider,
  DesignSystemProvider,
} from "@livepeer/design-system";
import { ThemeProvider } from "next-themes";
import { DEFAULT_THEME } from "../lib/theme";
import {
  createReactClient,
  LivepeerConfig,
  studioProvider,
  ThemeConfig,
} from "@livepeer/react";
import "../css/hubspot.scss";
import { isStaging } from "lib/utils";
import { getEndpoint } from "../hooks/use-api";

import "../css/recaptcha.css";
import "../css/markdown.css";
import "@radix-ui/themes/styles.css";

const queryClient = new QueryClient();

const globalStyles = globalCss({
  body: {
    margin: 0,
    bc: "$loContrast",
    fontFamily: "Inter",
    color: "$hiContrast",
  },

  ".main": {
    bc: "$loContrast",
  },

  "h1, h2, h3, h4, h5": { fontWeight: 500 },

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

const themes: any = getThemes();
const themeMap = {};
Object.keys(themes).map(
  (key, _index) => (themeMap[themes[key].className] = themes[key].className)
);

const livepeerClient = createReactClient({
  provider: studioProvider({
    // we intentionally provide no API key so any requests requiring auth will fail
    // eventually should move to using JWT from user's login
    apiKey: "",
    baseUrl: `${getEndpoint()}/api`,
    webrtcIngestBaseUrl: `${getEndpoint()}/webrtc`,
  }),
});

const livepeerTheme: ThemeConfig = {
  colors: {
    accent: "$colors$green10",
  },
  fontSizes: {
    timeFontSize: "0.85rem",
    timeFontSizeMd: "0.85rem",
    timeFontSizeSm: "0.85rem",
    titleFontSize: "0.9rem",
    titleFontSizeMd: "0.9rem",
    titleFontSizeSm: "0.9rem",
    errorTitleFontSize: "1.3rem",
    errorTitleFontSizeMd: "1.3rem",
    errorTitleFontSizeSm: "1.3rem",
    errorTextFontSize: "0.85rem",
    errorTextFontSizeMd: "0.85rem",
    errorTextFontSizeSm: "0.85rem",
  },
};

const App = ({ Component, pageProps }) => {
  globalStyles();
  return (
    <>
      <title>Livepeer Studio</title>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <DesignSystemProvider>
        <Theme appearance="light">
          <ThemeProvider
            forcedTheme={DEFAULT_THEME}
            disableTransitionOnChange
            attribute="class"
            defaultTheme={DEFAULT_THEME}
            value={{
              ...themeMap,
              dark: "dark-theme-green",
              light: "light-theme-green",
            }}>
            <SnackbarProvider>
              <QueryClientProvider client={queryClient}>
                <MetaMaskProvider>
                  <ApiProvider>
                    <AnalyzerProvider>
                      <LivepeerConfig
                        theme={livepeerTheme}
                        client={livepeerClient}>
                        <DefaultSeo {...SEO} />
                        <Component {...pageProps} />
                      </LivepeerConfig>
                    </AnalyzerProvider>
                  </ApiProvider>
                </MetaMaskProvider>
              </QueryClientProvider>
            </SnackbarProvider>
          </ThemeProvider>
        </Theme>
      </DesignSystemProvider>
    </>
  );
};

export default App;
