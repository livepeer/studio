"use client";

import {
  LivepeerConfig,
  ThemeConfig,
  createReactClient,
  studioProvider,
} from "@livepeer/react";
import { getEndpoint } from "hooks/use-api";

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

export function LivepeerConfigProvider({ children }) {
  return (
    <LivepeerConfig theme={livepeerTheme} client={livepeerClient}>
      {children}
    </LivepeerConfig>
  );
}
