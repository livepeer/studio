import Link from "next/link";
import { Box, Flex, Text, Link as A } from "@livepeer.com/design-system";

const Post = ({ href, title, label }) => (
  <Link href={href} passHref>
    <A
      css={{
        textDecoration: "none",
        p: "$4",
        borderRadius: 16,
        border: "1px solid $mauve5",
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
          opacity: 1,
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
        "&:hover": {
          textDecoration: "none",
        },
      }}>
      <Text variant="gray">{title}</Text>
      <Flex align="center" css={{ mt: "$2" }}>
        <Box>{label ?? "Read guide"}</Box>
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
      </Flex>
    </A>
  </Link>
);

export default Post;
