import { Global } from "@emotion/core";
import React, { memo } from "react";
import { useThemeUI, ThemeProvider as TP, Styled } from "theme-ui";

export const theme = {
  space: [0, 4, 8, 16, 32, 64, 128, 256, 512],
  fonts: {
    body:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
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
    text: "#292929",
    background: "#fff",
    primary: "#131418",
    secondary: "#FAF5EF",
    accent: "#00EB88",
    muted: "#eaeaea",
    gray: "#fafafa",
    listText: "#666666",
    extremelyBlue: "#3F3FE2",
  },
  buttons: {
    default: {
      color: "text",
      borderWidth: "1px",
      borderColor: "transparent",
      borderStyle: "solid",
      bg: "initial",
      display: "inline-block",
      borderRadius: 4,
      lineHeight: 1.4,
      letterSpacing: ".5px",
      fontWeight: 500,
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
        color: "listText",
        borderWidth: "1px",
        borderColor: "listText",
        borderStyle: "solid",
        opacity: 0.6,
      },
    },
    primary: {
      variant: "buttons.default",
      color: "white",
      bg: "primary",
      py: "10px",
    },
    secondary: {
      variant: "buttons.default",
      color: "background",
      bg: "primary",
      borderWidth: "1px",
      borderColor: "primary",
      borderStyle: "solid",
    },
    outline: {
      variant: "buttons.default",
      bg: "transparent",
      borderColor: "text",
      color: "text",
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
      py: "6px",
    },
    primarySmall: {
      variant: "buttons.primary",
      fontSize: 14,
      px: 3,
      py: "6px",
    },
    secondarySmall: {
      variant: "buttons.secondary",
      fontSize: 14,
      px: 3,
      py: "6px",
    },
  },
  forms: {
    input: {
      py: 2,
      px: 3,
      borderColor: "listText",
      borderRadius: 4,
    },
  },
  links: {
    nav: {
      cursor: "pointer",
      color: "body",
      textDecoration: "none",
      mx: 3,
      fontSize: 1,
    },
  },
  layout: {
    container: {
      maxWidth: 1200,
      px: [3, 3, 3, 3, 0],
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
      color: "extremelyBlue",
    },
    pre: {
      borderRadius: 12,
      fontFamily: "monospace",
      overflowX: "auto",
      padding: 4,
      cursor: "text",
      backgroundColor: (t) => `${t.colors.primary} !important`,
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
        color: "#131418",
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
    }}
  />
);

export { useThemeUI as useTheme, Reset, ThemeProvider };
