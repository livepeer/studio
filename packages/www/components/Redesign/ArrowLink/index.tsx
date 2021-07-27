import { Box, Link as A } from "@livepeer.com/design-system";
import Link from "next/link";

const ArrowLink = ({
  href,
  hideArrow = false,
  color = "$hiContrast",
  children,
  css = {},
}) => {
  return (
    <Link href={href} passHref>
      <A
        css={{
          color,
          textDecoration: "none",
          fontWeight: 500,
          display: "flex",
          ai: "center",
          "&:hover *": {
            color: "$hiContrast",
          },
          ".HoverArrow": {
            position: "relative",
            top: "1px",
            marginLeft: "4px",
            strokeWidth: "2",
            fill: "none",
            stroke: "currentColor",
          },
          ".HoverArrow__linePath": {
            opacity: "0",
            transition: "opacity cubic-bezier(0.215,0.61,0.355,1) .1s",
          },
          ".HoverArrow__tipPath": {
            opacity: hideArrow ? 0 : 1,
            transition:
              "transform cubic-bezier(0.215,0.61,0.355,1) .1s, transform cubic-bezier(0.215,0.61,0.355,1) .1s",
          },
          "&:hover .HoverArrow": {
            transition: "cubic-bezier(0.215,0.61,0.355,1) .1s",
            ".HoverArrow__linePath": {
              opacity: 1,
            },
            ".HoverArrow__tipPath": {
              opacity: 1,
              transform: "translateX(3px)",
            },
          },
          ...css,
        }}>
        <Box>{children}</Box>
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
      </A>
    </Link>
  );
};

export default ArrowLink;
