import Link from "next/link";
import { Link as A } from "@theme-ui/components";
import { useRef, useState, useCallback, useEffect } from "react";
import getMaxLines from "../../../lib/utils";
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
    setExcerptMaxLines(maxLines - 1);
  }, [titleRef, excerptRef]);

  useEffect(() => {
    getExcerptMaxLines();
    window.addEventListener("resize", getExcerptMaxLines);

    return () => window.removeEventListener("resize", getExcerptMaxLines);
  }, [getExcerptMaxLines]);

  return (
    <Link href={href} as={asPath}>
      <A>
        <h4 ref={titleRef}>{title}</h4>
        <Box
          as="p"
          sx={{
            mb: "3",
            color: "gray",
            textOverflow: "ellipsis",
            WebkitLineClamp: excerptMaxLines,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            display: excerptMaxLines === 0 ? "none" : "-webkit-box"
          }}
          ref={excerptRef}
        >
          {excerpt}
        </Box>
      </A>
    </Link>
  );
};

export default DocsPopularTopicCard;
