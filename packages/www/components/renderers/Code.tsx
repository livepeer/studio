import Highlight, { defaultProps } from "prism-react-renderer";
import theme from "prism-react-renderer/themes/vsDark";

const Code = ({ language, value, children, className, ...rest }) => {
  if (className && className.startsWith("language-")) {
    language = className.replace("language-", "");
  }

  return (
    <Highlight
      {...defaultProps}
      {...rest}
      code={value ?? children}
      language={language}
      theme={theme}
    >
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre className="codeblock-pre-container">
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
        </pre>
      )}
    </Highlight>
  );
};

export default Code;
