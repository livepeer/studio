/** @jsx jsx */
import { jsx } from "theme-ui";
import { useEffect, useRef, useState, useCallback } from "react";
import readingTime from "reading-time";
import { blocksToText, getMaxLines } from "../../lib/utils";
import Link from "next/link";
import { Flex, Box, Link as A } from "@theme-ui/components";
import imageUrlBuilder from "@sanity/image-url";
import client from "../../lib/client";

// Super hardcoded values to calculate the excerpt height. Yep.
const cardHeight = 403;
const cardContentHeight = cardHeight;
const categoryTagHeight = 15;
const authorHeight = 72;
const footerLinkHeight = 20;
const cardPadding = 40;

const FeaturedBlogPostCard = ({ post }: { post: any }) => {
  const text = blocksToText(post.contentRaw);
  const stats = readingTime(text);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const excerptRef = useRef<HTMLParagraphElement>(null);
  const [excerptMaxLines, setExcerptMaxLines] = useState<number>();

  const builder = imageUrlBuilder(client as any);

  const getExcerptMaxLines = useCallback(() => {
    if (!titleRef.current || !excerptRef.current) return;
    const maxExcerptHeight =
      cardHeight -
      categoryTagHeight -
      authorHeight -
      footerLinkHeight -
      cardPadding * 2 -
      titleRef.current.clientHeight;
    const maxLines = getMaxLines(excerptRef.current, maxExcerptHeight);
    setExcerptMaxLines(maxLines - 1);
  }, [titleRef, excerptRef]);

  useEffect(() => {
    getExcerptMaxLines();
    window.addEventListener("resize", getExcerptMaxLines);

    return () => window.removeEventListener("resize", getExcerptMaxLines);
  }, [getExcerptMaxLines]);

  return (
    <Link href="/blog/[slug]" as={`/blog/${post.slug.current}`} passHref>
      <A
        sx={{
          width: "100%",
          display: "flex",
          textDecoration: "none",
          color: "initial",
          marginRight: "auto",
          cursor: "pointer",
          borderRadius: 24,
          border: "1px solid",
          borderColor: "#F0F0F0",
          overflow: "hidden",
          height: cardHeight,
          transition: "box-shadow .2s",
          bg: "background",
          ":hover": {
            textDecoration: "none",
            boxShadow:
              "0px 2px 1px rgba(0, 0, 0, 0.04), 0px 16px 40px rgba(0, 0, 0, 0.04)",
          },
        }}>
        {post.mainImage && (
          <Box
            as="img"
            alt={post.mainImage?.alt}
            width={150}
            height={200}
            sx={{
              height: "100%",
              width: "40%",
              objectFit: "cover",
            }}
            className="lazyload"
            data-src={builder.image(post.mainImage).url()}
          />
        )}
        <Flex
          sx={{
            py: cardPadding,
            px: 32,
            flexDirection: "column",
            justifyContent: "space-between",
            height: cardContentHeight,
          }}>
          <Box>
            <Box
              sx={{
                color: "text",
                textTransform: "uppercase",
                lineHeight: "15px",
                fontSize: "12px",
                letterSpacing: "-0.02em",
                fontWeight: 600,
                height: categoryTagHeight,
              }}>
              {post.category.title}
            </Box>
            <Flex
              sx={{
                alignItems: "center",
                pt: 3,
                pb: 24,
                height: authorHeight,
              }}>
              <Box
                as="img"
                alt={post.author.image?.alt}
                width={30}
                height={30}
                sx={{
                  mt: [2, 0],
                  height: 30,
                  width: 30,
                  borderRadius: 1000,
                  objectFit: "cover",
                  mr: 3,
                }}
                className="lazyload"
                data-src={builder.image(post.author.image).url()}
              />
              <Box
                sx={{
                  fontWeight: 600,
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}>
                {post.author.name}
              </Box>
              <Box sx={{ mx: 2, width: "2px", height: 16, bg: "grey" }} />
              <Box
                sx={{
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}>
                {stats.text}
              </Box>
            </Flex>
            <Box
              as="h2"
              ref={titleRef}
              sx={{
                fontSize: "32px",
                lineHeight: "40px",
                letterSpacing: "-0.03em",
                fontWeight: 500,
                pb: 3,
                transition: "color .3s",
              }}>
              {post.title}
            </Box>
            <Box
              sx={{
                mb: 3,
                color: "gray",
                textOverflow: "ellipsis",
                WebkitLineClamp: excerptMaxLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                display: excerptMaxLines <= 0 ? "none" : "-webkit-box",
              }}
              ref={excerptRef}>
              {post.excerpt}
            </Box>
          </Box>
          <A as="p" sx={{ fontWeight: 600, margin: 0 }}>
            Read more
          </A>
        </Flex>
      </A>
    </Link>
  );
};

export default FeaturedBlogPostCard;
