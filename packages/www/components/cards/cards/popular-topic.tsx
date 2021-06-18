/** @jsx jsx */
import { jsx } from "theme-ui";
import Link from "next/link";
import { Link as A } from "@theme-ui/components";
import { useRef, useState, useCallback, useEffect } from "react";
import { getMaxLines } from "../../../lib/utils";
import { Box } from "@theme-ui/components";

const cardHeight = 142;
const cardPadding = 24;

type Props = {
  href: string;
  asPath?: string;
  title: string;
  excerpt: string;
};

const DocsPopularTopicCard = ({ href, asPath, title, excerpt }: Props) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const excerptRef = useRef<HTMLParagraphElement>(null);

  const [excerptMaxLines, setExcerptMaxLines] = useState<number>();

  const getExcerptMaxLines = useCallback(() => {
    if (!titleRef.current || !excerptRef.current) return;
    const maxExcerptHeight =
      cardHeight - cardPadding * 2 - titleRef.current.clientHeight;
    const maxLines = getMaxLines(excerptRef.current, maxExcerptHeight);
    setExcerptMaxLines(maxLines);
  }, [titleRef, excerptRef]);

  useEffect(() => {
    getExcerptMaxLines();
    window.addEventListener("resize", getExcerptMaxLines);

    return () => window.removeEventListener("resize", getExcerptMaxLines);
  }, [getExcerptMaxLines]);

  return (
    <Link href={href} as={asPath} passHref>
      <A
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          bg: "#fafafa",
          textAlign: "left",
          borderRadius: 24,
          p: 24,
          height: cardHeight,
          transition: "background-color .2s",
          "&:hover": {
            bg: "#F0F0F0",
            textDecoration: "none",
          },
        }}>
        <h4
          ref={titleRef}
          sx={{
            color: "text",
            fontWeight: 600,
            fontSize: "19px",
            lineHeight: "23px",
            letterSpacing: "-0.03em",
            pb: 2,
          }}>
          {title}
        </h4>
        <Box
          as="p"
          sx={{
            color: "gray",
            textOverflow: "ellipsis",
            WebkitLineClamp: excerptMaxLines,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            display: excerptMaxLines <= 0 ? "none" : "-webkit-box",
            fontSize: "18px",
            lineHeight: 1.6,
          }}
          ref={excerptRef}>
          {excerpt}
        </Box>
      </A>
    </Link>
  );
};

export default DocsPopularTopicCard;
