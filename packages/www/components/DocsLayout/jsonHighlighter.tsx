/** @jsx jsx */
import { jsx } from "theme-ui";
import { useMemo } from "react";

/**
 * Hat tip to PumBaa80 http://stackoverflow.com/questions/4810841/json-pretty-print-using-javascript
 * for the syntax highlighting function.
 * */
type Props = {
  json: string | Record<string, unknown>;
};

const DocsJSONHighlighter = ({ json }: Props) => {
  const html = useMemo(() => {
    const parsed = typeof json === "string" ? JSON.parse(json) : json;
    let jsonString = JSON.stringify(parsed);

    jsonString = jsonString
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return jsonString.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = "number";
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = "key";
          } else {
            cls = "string";
          }
        } else if (/true|false/.test(match)) {
          cls = "boolean";
        } else if (/null/.test(match)) {
          cls = "null";
        }
        return `<span style="color: ${
          cls === "number" ? "#D486E0" : "white"
        }" >${match}</span>`;
      }
    );
  }, [json]);

  return (
    <pre
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
      sx={{
        fontSize: "14px",
        lineHeight: "24px",
        color: "white",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    />
  );
};

export default DocsJSONHighlighter;
