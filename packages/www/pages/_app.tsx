import Head from "next/head";
import { DefaultSeo } from "next-seo";
import SEO from "../next-seo.config";
import { ApiProvider } from "hooks/use-api";
import { AnalyzerProvider } from "hooks/use-analyzer";
import { QueryClient, QueryClientProvider } from "react-query";
import { MetaMaskProvider } from "metamask-react";
import "../css/algolia-docsearch.css";
import "../css/recaptcha.css";
import React from "react";
import {
  globalCss,
  getThemes,
  SnackbarProvider,
  DesignSystemProvider,
} from "@livepeer/design-system";
import { ThemeProvider } from "next-themes";
import { DEFAULT_THEME } from "../lib/theme";
import { createReactClient, LivepeerConfig } from "@livepeer/react";
import { studioProvider } from "livepeer/providers/studio";

const queryClient = new QueryClient();

const globalStyles = globalCss({
  body: {
    margin: 0,
    bc: "$loContrast",
    fontFamily: "$untitled",
    color: "$hiContrast",
  },

  ".main": {
    bc: "$loContrast",
    fontFamily: "Matter",
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
  provider: studioProvider({ apiKey: "b05094e0-05b6-4260-b462-bae581fdcf13" }), // TODO: replace with env var
});

const App = ({ Component, pageProps }) => {
  globalStyles();
  return (
    <>
      <title>Livepeer Studio</title>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <DesignSystemProvider>
        <ThemeProvider
          forcedTheme={Component.theme || undefined}
          disableTransitionOnChange
          attribute="class"
          defaultTheme={DEFAULT_THEME}
          value={{
            ...themeMap,
            dark: "dark-theme-blue",
            light: "light-theme-blue",
          }}>
          <SnackbarProvider>
            <QueryClientProvider client={queryClient}>
              <MetaMaskProvider>
                <ApiProvider>
                  <AnalyzerProvider>
                    <LivepeerConfig client={livepeerClient}>
                      <DefaultSeo {...SEO} />
                      <Component {...pageProps} />
                    </LivepeerConfig>
                  </AnalyzerProvider>
                </ApiProvider>
              </MetaMaskProvider>
            </QueryClientProvider>
          </SnackbarProvider>
        </ThemeProvider>
      </DesignSystemProvider>
    </>
  );
};

export default App;
