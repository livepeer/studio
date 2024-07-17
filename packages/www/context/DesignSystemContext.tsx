"use client";

import { getThemes, globalCss } from "@livepeer/design-system";
import {
  DesignSystemProvider as LivepeerDesignSystemProvider,
  SnackbarProvider,
} from "@livepeer/design-system";
import React from "react";

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

export function DesignSystemProvider({ children }) {
  globalStyles();

  return (
    <LivepeerDesignSystemProvider>
      <SnackbarProvider>{children}</SnackbarProvider>
    </LivepeerDesignSystemProvider>
  );
}
