/** @jsx jsx */
import { jsx } from "theme-ui";
import { useState } from "react";
import { Box } from "@theme-ui/components";

const Textfield = ({
  disabled = false,
  onFocus = null,
  onBlur = null,
  type = "text",
  error = false,
  autoFocus = false,
  required = false,
  messageFixed = false,
  messageColor = "text",
  defaultValue = undefined,
  value = undefined,
  inputRef = undefined,
  onChange = null,
  message = null,
  as = "input",
  rows = 2,
  name = "",
  htmlFor = "",
  pattern = null,
  id = "",
  label,
  pushInputSx = {},
  variant = "outlined",
  fixedLabel = false,
  placeholder = "",
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const [scopedValue, setScopedValue] = useState("");
  return (
    <Box
      sx={{
        bg: "background",
        borderRadius: 8,
        border: "0",
        margin: "0",
        display: "inline-flex",
        padding: "0",
        position: "relative",
        minWidth: "0",
        flexDirection: "column",
        verticalAlign: "top",
      }}
      {...props}>
      <Box
        as="label"
        sx={{
          zIndex: 0,
          transform:
            fixedLabel || defaultValue || value || scopedValue || focused
              ? `translate(${
                  variant === "outlined" ? "16px, 10px" : "0, 4px"
                }) scale(0.75)`
              : `translate(${
                  variant === "outlined" ? "16px" : "0"
                }, 18px) scale(1)`,
          pointerEvents: "none",
          top: "0",
          left: "0",
          position: "absolute",
          transition:
            "color 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms,transform 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms",
          display: "block",
          transformOrigin: "top left",
          color: "offBlack",
          padding: 0,
          fontSize: 16,
          lineHeight: 1,
          fontWeight: fixedLabel ? 500 : 400,
        }}
        htmlFor={htmlFor}
        id={id}>
        {label}
      </Box>
      <Box
        sx={{
          transition: "background-color 200ms cubic-bezier(0.0, 0, 0.2, 1) 0ms",
          backgroundColor: "rgba(255, 255, 255, 0.09)",
          color: "text",
          cursor: "text",
          display: "inline-flex",
          position: "relative",
          fontSize: "1rem",
          boxSizing: "border-box",
          alignItems: "center",
          lineHeight: "1.1875em",
        }}>
        <Box
          as={as ? as : "input"}
          rows={rows}
          onFocus={onFocus ? onFocus : () => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          autoFocus={autoFocus}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          value={value}
          pattern={pattern}
          onChange={onChange ? onChange : (e) => setScopedValue(e.target.value)}
          ref={inputRef}
          name={name}
          sx={{
            padding: variant === "outlined" ? "24px 16px 8px" : "22px 0 6px",
            fontSize: 16,
            color: "currentColor",
            width: "100%",
            margin: "0",
            display: "block",
            minWidth: "0",
            background: "none",
            boxSizing: "content-box",
            WebkitTapHighlightColor: "transparent",
            borderRadius: variant === "outlined" ? 8 : 0,
            borderTop: variant === "outlined" ? "1px solid" : 0,
            borderBottom: "1px solid",
            borderLeft: variant === "outlined" ? "1px solid" : 0,
            borderRight: variant === "outlined" ? "1px solid" : 0,
            borderColor: "ultraLightGray",
            transition: "border-color .2s",
            "&:hover": {
              borderColor: "primary",
            },
            "&:focus": {
              outline: "none",
              boxShadow:
                variant === "outlined"
                  ? "0px 0px 0px 3px rgba(148, 60, 255, 0.3)"
                  : "none",
              borderColor: "primary",
            },
            ...pushInputSx,
          }}
          id={id}
          type={type}
        />
      </Box>
      {(messageFixed || message) && (
        <Box
          sx={{
            height: 16,
            color: error ? "red" : messageColor,
            pt: "62px",
            pl: "12px",
            fontSize: 0,
          }}>
          {message}
        </Box>
      )}
    </Box>
  );
};

export default Textfield;
