import { useMemo } from "react";

/**
 * Hat tip to PumBaa80 http://stackoverflow.com/questions/4810841/json-pretty-print-using-javascript
 * for the syntax highlighting function.
 * */
type Props = {
  json: string | Record<string, unknown>;
  className?: string;
};

const JSONHighlighter = ({ json, className }: Props) => {
  const html = useMemo(() => {
    const parsed = typeof json === "string" ? JSON.parse(json) : json;
    let jsonString = JSON.stringify(parsed, null, 2);

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
        return `<span style="color: ${cls === 'number' ? '#943CFF' : 'black'}" >${match}</span>`;
      }
    );
  }, [json]);


  return (
    <pre
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
      className={className}
      sx={{ fontSize: '12px' }}
    />
  );
};

JSONHighlighter.defaultProps = {
  className: "",
};

export default JSONHighlighter;
