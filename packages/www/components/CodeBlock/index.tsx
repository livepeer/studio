// src/CodeBlock.js
import React from "react";
import Highlight, { defaultProps } from "prism-react-renderer";
import theme from "prism-react-renderer/themes/vsDark";
import { Box } from "@theme-ui/components";

const CodeBlock = ({ children, className }) => {
  let language = null;
  if (className && className.startsWith("language-")) {
    language = className.replace("language-", "");
  }
  return (
    <Highlight
      {...defaultProps}
      code={children}
      language={language}
      theme={theme}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <Box>
          {tokens.map((line, i) => {
            // Workaround for MDX rendering trailing lines on everything
            const lastLine = i === tokens.length - 1;
            return (
              <div key={i} {...getLineProps({ line, key: i })}>
                {line.map((token, key) => {
                  if (lastLine && token.empty) {
                    return null;
                  }
                  return <span key={key} {...getTokenProps({ token, key })} />;
                })}
              </div>
            );
          })}
        </Box>
      )}
    </Highlight>
  );
};

export default CodeBlock;
