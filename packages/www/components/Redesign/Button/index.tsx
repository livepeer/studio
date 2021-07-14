import { Box, Button as ButtonBase } from "@livepeer.com/design-system";

// TODO: move this component into design system package as a button variant
const Button = ({ arrow = false, children, css = {}, ...props }) => {
  return (
    <ButtonBase
      variant="violet"
      css={{
        display: "flex",
        ai: "center",
        borderRadius: 1000,
        color: "white",
        background:
          "linear-gradient(to right, $colors$violet9, $colors$indigo10)",
        boxShadow: "none",
        cursor: "pointer",
        textDecoration: "none",
        "&:hover": {
          textDecoration: "none",
          background:
            "linear-gradient(to right, $colors$indigo9, $colors$violet10)",
          color: "white",
          boxShadow: "none",
        },
        ...css,
      }}
      size="3"
      {...props}>
      <Box
        css={{
          display: "flex",
          ai: "center",
          color: "white",
          ".HoverArrow": {
            position: "relative",
            marginLeft: "8px",
            strokeWidth: "2",
            fill: "none",
            stroke: "currentColor",
          },
          ".HoverArrow__linePath": {
            opacity: "0",
            transition: "opacity cubic-bezier(0.215,0.61,0.355,1) .1s",
          },
          ".HoverArrow__tipPath": {
            transition:
              "transform cubic-bezier(0.215,0.61,0.355,1) .1s, transform cubic-bezier(0.215,0.61,0.355,1) .1s",
          },
          "&:hover .HoverArrow": {
            transition: "cubic-bezier(0.215,0.61,0.355,1) .1s",
            ".HoverArrow__linePath": {
              opacity: 1,
            },
            ".HoverArrow__tipPath": {
              transform: "translateX(3px)",
            },
          },
        }}>
        {children}
        {arrow && (
          <svg
            className="HoverArrow"
            width="10"
            height="10"
            viewBox="0 0 10 10"
            aria-hidden="true">
            <g fillRule="evenodd">
              <path className="HoverArrow__linePath" d="M0 5h7" />
              <path className="HoverArrow__tipPath" d="M1 1l4 4-4 4" />
            </g>
          </svg>
        )}
      </Box>
    </ButtonBase>
  );
};

export default Button;
