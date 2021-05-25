/** @jsx jsx */
import { jsx } from "theme-ui";
import Highlight, { defaultProps } from "prism-react-renderer";
import theme from "prism-react-renderer/themes/vsDark";
import { useRef, useState } from "react";

const Code = ({ language, custom, value, children, className, ...rest }) => {
  const [copyState, setCopyState] = useState(false);
  if (className && className.startsWith("language-")) {
    language = className.replace("language-", "");
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopyState(true);
    setTimeout(() => {
      setCopyState(false);
    }, 5000);
  };

  const customTheme = {
    plain: {
      backgroundColor: custom ? "#3B375A" : "#9CDCFE",
      color: custom ? "#fff" : "#1E1E1E",
    },
    styles: [
      {
        types: ["comment", "prolog", "doctype", "cdata", "punctuation"],
        style: {
          color: custom ? "#8782AC" : "rgb(0, 0, 128)",
        },
      },
      {
        types: ["namespace"],
        style: {
          opacity: 0.7,
        },
      },
      {
        types: ["tag", "operator", "number"],
        style: {
          color: custom ? "#C16AB9" : "rgb(181, 206, 168)",
        },
      },
      {
        types: ["property", "function"],
        style: {
          color: custom ? "#C4ED98" : "rgb(220, 220, 170)",
        },
      },
      {
        types: ["tag-id", "selector", "atrule-id"],
        style: {
          color: custom ? "#C4ED98" : "rgb(215, 186, 125)",
        },
      },
      {
        types: ["attr-name"],
        style: {
          color: custom ? "#C4ED98" : "rgb(156, 220, 254)",
        },
      },
      {
        types: [
          "boolean",
          "string",
          "entity",
          "url",
          "attr-value",
          "keyword",
          "control",
          "directive",
          "unit",
          "statement",
          "regex",
          "at-rule",
          "placeholder",
          "variable",
        ],
        style: {
          color: custom ? "#C4ED98" : "rgb(206, 145, 120)",
        },
      },
      {
        types: ["deleted"],
        style: {
          textDecorationLine: "line-through",
        },
      },
      {
        types: ["inserted"],
        style: {
          textDecorationLine: "underline",
        },
      },
      {
        types: ["italic"],
        style: {
          fontStyle: "italic",
        },
      },
      {
        types: ["important", "bold"],
        style: {
          fontWeight: "bold",
        },
      },
      {
        types: ["important"],
        style: {
          color: "#c4b9fe",
        },
      },
    ],
  };

  return (
    <Highlight
      {...defaultProps}
      {...rest}
      code={value ?? children}
      language={language}
      // @ts-ignore
      theme={customTheme}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre
          className="codeblock-pre-container"
          sx={{
            background: custom ? "#3B375A" : "",
            borderRadius: custom ? "16px" : "",
            width: "100%",
            maxWidth: "calc(100vw - 64px)",
            display: "flex",
            flexDirection: "column",
            marginBottom: custom ? "56px" : "",
            padding: custom ? "24px 16px 60px 24px" : "",
            position: "relative",
          }}>
          <div sx={{ maxWidth: "100%", overflowX: "scroll" }}>
            {tokens.map((line, i) => {
              // Workaround for MDX rendering trailing lines on everything
              const lastLine = i === tokens.length - 1;
              return (
                <div key={i} {...getLineProps({ line, key: i })}>
                  {line.map((token, key) => {
                    if (lastLine && token.empty) {
                      return null;
                    }
                    return (
                      <span key={key} {...getTokenProps({ token, key })} />
                    );
                  })}
                </div>
              );
            })}
          </div>
          <textarea sx={{ display: "none" }} />
          {custom && (
            <button
              onClick={handleCopy}
              sx={{
                position: "absolute",
                alignSelf: "flex-end",
                bottom: "16px",
                right: "16px",
                background: "#943CFF",
                borderRadius: "6px",
                width: "60px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "14px",
                fontWeight: "500",
                letterSpacing: "-0.03em",
                cursor: "pointer",
                outline: 'none',
                ':focus': {
                  outline: 'none'
                }
              }}>
              {copyState ? "Copied" : "Copy"}
            </button>
          )}
        </pre>
      )}
    </Highlight>
  );
};

export default Code;
