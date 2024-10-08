import {
  DesignSystemProvider,
  SnackbarProvider,
  getThemes,
  globalCss,
} from "@livepeer/design-system";
import {
  LivepeerConfig,
  ThemeConfig,
  createReactClient,
  studioProvider,
} from "@livepeer/react";
import { AnalyzerProvider } from "hooks/use-analyzer";
import { ApiProvider, getEndpoint } from "hooks/use-api";
import { getBrandName } from "lib/utils";
import { DefaultSeo } from "next-seo";
import { ThemeProvider } from "next-themes";
import Head from "next/head";
import { QueryClient, QueryClientProvider } from "react-query";
import "../css/hubspot.scss";
import "../css/markdown.css";
import "../css/recaptcha.css";
import "../css/tailwind.css";
import { DEFAULT_THEME } from "../lib/theme";
import SEO from "../next-seo.config";
import { ProjectProvider } from "context/ProjectContext";
import useSyncProjectId from "hooks/use-project";

const queryClient = new QueryClient();

const globalStyles = globalCss({
  html: {
    height: "100%",
  },
  body: {
    margin: 0,
    bc: "hsl(var(--background))",
    fontFamily: "Inter",
    color: "$hiContrast",
    height: "100%",
  },

  ".main": {
    bc: "hsl(var(--background))",
  },

  "h1, h2, h3, h4, h5": { fontWeight: 500 },

  svg: { display: "block" },

  "pre, code": { margin: 0, fontFamily: "$mono" },

  "#__next": {
    position: "relative",
    zIndex: 0,
    height: "100%",
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
  (key, _index) => (themeMap[themes[key].className] = themes[key].className),
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

const SyncProjectId = () => {
  useSyncProjectId();
  return null;
};

const App = ({ Component, pageProps }) => {
  globalStyles();
  return (
    <>
      <title>{getBrandName()}</title>
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
          <ProjectProvider>
            <SyncProjectId />
            <SnackbarProvider>
              <QueryClientProvider client={queryClient}>
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
              </QueryClientProvider>
            </SnackbarProvider>
          </ProjectProvider>
        </ThemeProvider>
      </DesignSystemProvider>
    </>
  );
};

export default App;
