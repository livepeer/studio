"use client";

import { Global } from "@emotion/core";
import { theme } from "lib/theme";
import React, { memo } from "react";
import { useThemeUI, ThemeProvider as TP, Styled } from "theme-ui";

const ThemeProvider = memo(({ children, ...props }: any) => (
  <TP theme={theme} {...props}>
    <Styled.root>{children}</Styled.root>
  </TP>
));

const Reset = () => (
  <Global
    styles={{
      body: {
        margin: "0",
      },
      "h1, h2, h3, h4, h5, h6": {
        margin: 0,
        fontWeight: 700,
      },
      h1: {
        fontSize: 56,
        lineHeight: 1.1,
      },
      h2: {
        fontSize: 48,
        lineHeight: 1.1,
      },
      h3: {
        fontSize: 32,
        lineHeight: 1.1,
      },
      h4: {
        fontSize: 24,
        lineHeight: 1.1,
      },
      h5: {
        fontSize: 16,
        lineHeight: 1.1,
      },
      small: {
        fontSize: "100%",
      },
      a: {
        color: "#000",
      },
      ".react-reveal": {
        opacity: 0,
      },
      li: {
        marginBottom: "6px",
      },
      table: {
        padding: "0",
      },
      "table tr": {
        borderTop: "1px solid #cccccc",
        backgroundColor: "white",
        margin: "0",
        padding: "0",
      },
      "table tr:nth-of-type(2n)": {
        backgroundColor: "#f8f8f8",
      },
      "table tr th": {
        fontWeight: "bold",
        border: "1px solid #cccccc",
        textAlign: "left",
        margin: "0",
        padding: "6px 13px",
      },
      "table tr td": {
        border: "1px solid #cccccc",
        textAlign: "left",
        margin: "0",
        padding: "6px 13px",
      },
      "table tr th :first-of-type": {
        marginTop: 0,
      },
      "table tr td :first-of-type": {
        marginTop: "0",
      },
      "table tr th :last-of-type": {
        marginBottom: "0",
      },
      "table tr td :last-of-type": {
        marginBottom: "0",
      },
      "img.lazyload:not([src])": {
        visibility: "hidden",
      },
      ".lazyload": {
        opacity: 0,
      },
      ".lazyloading": {
        opacity: 0,
      },
      ".lazyloaded": {
        opacity: 1,
        transition: "opacity .3s",
      },
      "#hubspot-messages-iframe-container iframe": {
        colorScheme: "auto",
      },
    }}
  />
);

export { useThemeUI as useTheme, Reset, ThemeProvider };
