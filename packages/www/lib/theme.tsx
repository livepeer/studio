import { Global } from "@emotion/core";
import React, { memo } from "react";
import { useThemeUI, ThemeProvider as TP, Styled } from "theme-ui";

export const theme = {
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  fonts: {
    body: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    heading: "inherit",
    monospace: "'Fira Code', Menlo, monospace",
  },
  fontSizes: [12, 14, 16, 20, 24, 32, 48, 56, 64, 96],
  fontWeights: {
    body: 400,
    heading: 600,
    bold: 700,
  },
  letterSpacings: {
    body: 0,
    heading: 0,
  },
  lineHeights: {
    body: 1.5,
    heading: 1.125,
  },
  colors: {
    text: "#000000",
    background: "#ffffff",
    primary: "#6e56cf",
    muted: "#eaeaea",
    gray: "#525252",
    lightGray: "#919191",
    ultraLightGray: "#E6E6E6",
    offBlack: "#666666",
    extremelyBlue: "#3F3FE2",
    red: "#ef2961",
  },

  breakpoints: ["640px", "832px", "1024px", "1280px"],
  buttons: {
    default: {
      color: "text",
      borderWidth: "1px",
      borderColor: "transparent",
      borderStyle: "solid",
      bg: "initial",
      display: "inline-block",
      borderRadius: 6,
      lineHeight: 1.4,
      letterSpacing: ".5px",
      fontWeight: 600,
      px: 4,
      py: "10px",
      cursor: "pointer",
      textDecoration: "none",
      ":focus": {
        outline: "none",
      },
      ":disabled": {
        cursor: "not-allowed",
        backgroundColor: "muted",
        color: "offBlack",
        opacity: 0.6,
        ":hover": {
          backgroundColor: "muted",
        },
      },
    },
    primary: {
      variant: "buttons.default",
      color: "white",
      bg: "primary",
      py: "10px",
      transition: "background-color .15s",
      "&:hover": {
        bg: "#761EE1",
      },
      ":focus": {
        outline: "none",
        boxShadow: "0px 0px 0px 3px rgba(148, 60, 255, 0.3)",
      },
    },
    secondary: {
      variant: "buttons.default",
      color: "text",
      bg: "background",
      borderWidth: "1px",
      borderColor: "transparent",
      borderStyle: "solid",
      transition: "background-color .15s",
      "&:hover": {
        bg: "rgba(255, 255, 255, .8)",
      },
      ":focus": {
        outline: "none",
        boxShadow: "0px 0px 0px 3px rgba(0, 0, 0, 0.3)",
      },
    },
    tertiary: {
      variant: "buttons.default",
      color: "background",
      bg: "text",
      borderWidth: "1px",
      borderColor: "transparent",
      borderStyle: "solid",
      transition: "background-color .15s",
      "&:hover": {
        bg: "transparent",
        borderColor: "text",
        color: "text",
      },
      ":focus": {
        outline: "none",
        boxShadow: "0px 0px 0px 3px rgba(0, 0, 0, 0.3)",
      },
    },
    outline: {
      variant: "buttons.default",
      borderWidth: "1px",
      borderColor: "black",
      bg: "transparent",
      color: "text",
      transition: "background-color .15s",
      "&:hover": { bg: "muted" },
    },
    text: {
      variant: "buttons.default",
      border: 0,
      fontWeight: 300,
    },
    large: {
      variant: "buttons.default",
      fontSize: 16,
    },
    primaryLarge: {
      variant: "buttons.primary",
      fontSize: 16,
    },
    outlineSmall: {
      variant: "buttons.outline",
      fontSize: 14,
      px: 3,
      py: "8px",
    },
    primarySmall: {
      variant: "buttons.primary",
      fontSize: 14,
      px: 3,
      py: "8px",
    },
    secondarySmall: {
      variant: "buttons.secondary",
      fontSize: 14,
      px: 3,
      py: "8px",
    },
    tertiarySmall: {
      variant: "buttons.tertiary",
      fontSize: 14,
      px: 3,
      py: "8px",
    },
    gradientOutlineSmall: {
      variant: "buttons.outlineSmall",
      color: "#fff",
      border: "2px solid #943CFF",
      letterSpacing: "0",
      display: "flex",
      alignItems: "center",
      background: "linear-gradient(-131deg, #ef00ff 0%, #7300ff 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      marginRight: "30px",
    },
    icon: {
      ":focus": {
        outline: "none",
        boxShadow: "0px 0px 0px 3px rgba(148, 60, 255, 0.3)",
      },
    },
    close: {
      color: "primary",
    },
    "close-info": {
      color: "primary",
    },
    "close-attention": {
      color: "background",
    },
  },
  forms: {
    input: {
      py: 2,
      px: 3,
      borderColor: "offBlack",
      borderRadius: 4,
    },
  },
  links: {
    download: {
      color: "body",
      textDecoration: "none",
      fontSize: 1,
    },
    downloadOutline: {
      variant: "links.download",
      borderRadius: 6,
      borderWidth: "1px",
      borderColor: "black",
      bg: "transparent",
      color: "text",
      transition: "background-color .15s",
      "&:hover": { bg: "muted" },
    },
    nav: {
      color: "body",
      textDecoration: "none",
      mr: 4,
      fontSize: 1,
      fontWeight: 600,
      "&:last-of-type": { mr: 0 },
    },
    mobileNav: {
      textAlign: "center",
      color: "body",
      textDecoration: "none",
      mb: 42,
      fontSize: "32px",
      lineHeight: "26px",
      fontWeight: 600,
      letterSpacing: "-0.02em",
    },
    footer: {
      color: "background",
      "&:hover": {
        textDecoration: "underline",
      },
    },
  },
  layout: {
    container: {
      maxWidth: 1328,
      px: [4, null, 5],
    },
    content: {
      maxWidth: 1122,
      px: [4, null, 5],
      py: [5, 6],
      mx: "auto",
    },
    blogPost: {
      maxWidth: 918,
      px: [4, null, 5],
    },
    hero: {
      textAlign: "center",
      maxWidth: 900,
      mb: 112,
      px: 4,
    },
  },
  text: {
    heading: {
      section: {
        fontSize: [5, 6],
        color: "text",
        fontWeight: "bold",
      },
      hero: {
        lineHeight: ["48px", "72px"],
        mt: [4, 5],
        mb: [2, 3],
        fontSize: ["40px", "8"],
        letterSpacing: "-0.05em",
        mx: "auto",
      },
    },
    heroDescription: {
      lineHeight: "32px",
      fontSize: 3,
      color: "text",
      mx: "auto",
    },
  },
  styles: {
    root: {
      fontFamily: "body",
      lineHeight: "body",
      fontWeight: "body",
      letterSpacing: "body",
      height: "100%",
    },
    h1: {
      color: "text",
      fontFamily: "heading",
      lineHeight: "heading",
      fontWeight: "bold",
      letterSpacing: "heading",
      fontSize: 7,
    },
    h2: {
      color: "text",
      fontFamily: "heading",
      lineHeight: "heading",
      fontWeight: "bold",
      letterSpacing: "heading",
      fontSize: 6,
    },
    h3: {
      color: "text",
      fontFamily: "heading",
      lineHeight: "heading",
      fontWeight: "heading",
      letterSpacing: "heading",
      fontSize: 5,
    },
    h4: {
      color: "text",
      fontFamily: "heading",
      lineHeight: "heading",
      fontWeight: "heading",
      letterSpacing: "heading",
      fontSize: 4,
    },
    h5: {
      color: "text",
      fontFamily: "heading",
      lineHeight: "heading",
      fontWeight: "heading",
      letterSpacing: "heading",
      fontSize: 3,
    },
    h6: {
      color: "text",
      fontFamily: "heading",
      lineHeight: "heading",
      fontWeight: "heading",
      letterSpacing: "heading",
      fontSize: 2,
    },
    p: {
      color: "text",
      fontFamily: "body",
      fontWeight: "body",
      lineHeight: "body",
    },
    a: {
      color: "primary",
      "&:hover": {
        textDecoration: "underline",
      },
    },
    pre: {
      borderRadius: 12,
      fontFamily: "monospace",
      overflowX: "auto",
      padding: 4,
      cursor: "text",
      code: {
        color: "inherit",
        WebkitFontSmoothing: "antialiased",
      },
    },
    code: {
      fontFamily: "monospace",
      fontSize: "inherit",
    },
    img: {
      maxWidth: "100%",
    },
  },
  alerts: {
    attention: {
      backgroundColor: "red",
    },
    info: {
      color: "#fff",
      border: "2px solid #943CFF",
      letterSpacing: "0",
      display: "flex",
      alignItems: "center",
      background: "linear-gradient(-131deg, #ef00ff 0%, #7300ff 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      marginRight: "30px",
    },
  },
};

const ThemeProvider = memo(({ children, ...props }) => (
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
    }}
  />
);

export { useThemeUI as useTheme, Reset, ThemeProvider };
