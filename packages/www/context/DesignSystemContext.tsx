"use client";

import {
  DesignSystemProvider as LivepeerDesignSystemProvider,
  SnackbarProvider,
} from "@livepeer/design-system";
import React from "react";

export function DesignSystemProvider({ children }) {
  return (
    <LivepeerDesignSystemProvider>
      <SnackbarProvider>{children}</SnackbarProvider>
    </LivepeerDesignSystemProvider>
  );
}
