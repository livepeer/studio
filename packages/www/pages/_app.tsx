import Head from "next/head";
import { DefaultSeo } from "next-seo";
import SEO from "../next-seo.config";
import { ApiProvider } from "hooks/use-api";
import { AnalyzerProvider } from "hooks/use-analyzer";
import { QueryClient, QueryClientProvider } from "react-query";
import { MetaMaskProvider } from "metamask-react";
import "../css/recaptcha.css";
import "../css/markdown.css";
import React from "react";
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
import Script from "next/script";

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

  'div[role="alertdialog"]': {
    zIndex: 100,
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

const RIPE_API_KEY = process.env.NEXT_PUBLIC_RIPE_API_KEY;

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
        <ThemeProvider
          forcedTheme={Component.theme || undefined}
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
                      <Script id="ripe-integration">
                        {`(function(a,b){var c=function(a){return fetch("".concat("https://storage.getripe.com","/sdk%2Fversion.txt?alt=media"),{cache:"no-store"}).then(function(a){return a.text()}).then(function(b){a(b)})};a.Ripe=a.Ripe||[],["init","identify","group","track","page"].forEach(function(b){a.Ripe[b]=function(){for(var c=arguments.length,d=Array(c),e=0;e<c;e++)d[e]=arguments[e];var f=Array.prototype.slice.call(d);return f.unshift(b),a.Ripe.push(f),a.Ripe}}),a.Ripe.load=function(){var a=b.createElement("script"),d=b.getElementsByTagName("script")[0];a.async=!0,c(function(b){var c;a.src="".concat("https://storage.getripe.com","/sdk%2F").concat(b,"%2Fsdk.umd.js?alt=media"),null===d||void 0===d||null===(c=d.parentNode)||void 0===c?void 0:c.insertBefore(a,d)})},a.Ripe.load()})(window,document);Ripe.init('${RIPE_API_KEY}')`}
                      </Script>
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
