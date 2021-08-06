import readingTime from "reading-time";
import { blocksToText } from "lib/utils";
import Link from "next/link";
import {
  Flex,
  Box,
  Text,
  Heading,
  Link as A,
} from "@livepeer.com/design-system";
import imageUrlBuilder from "@sanity/image-url";
import client from "lib/client";
import Image from "next/image";
import TextTruncate from "react-text-truncate";

export const FeaturedBlogPostCard = ({ post }: { post: any }) => {
  const text = blocksToText(post.contentRaw);
  const stats = readingTime(text);
  const builder = imageUrlBuilder(client as any);

  return (
    <Link href="/blog/[slug]" as={`/blog/${post.slug.current}`} passHref>
      <A
        css={{
          width: "100%",
          display: "inline-flex",
          alignItems: "flex-start",
          textDecoration: "none",
          color: "initial",
          marginRight: "auto",
          cursor: "pointer",
          borderRadius: 24,
          border: "1px solid",
          borderColor: "$mauve5",
          overflow: "hidden",
          height: 400,
          transition: "box-shadow .2s",
          bc: "$loContrast",
          "&:hover": {
            textDecoration: "none",
            boxShadow:
              "0px 2px 1px rgba(0, 0, 0, 0.04), 0px 16px 40px rgba(0, 0, 0, 0.04)",
          },
        }}>
        {post.mainImage && (
          <Box
            css={{
              position: "relative",
              width: "33%",
              height: 400,
              bc: "$panel",
            }}>
            <Image
              alt={post.mainImage?.alt}
              layout="fill"
              objectFit="cover"
              src={builder.image(post.mainImage).url()}
            />
          </Box>
        )}
        <Flex
          css={{
            px: "$5",
            py: "$5",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            width: "66%",
          }}>
          <Box>
            <Text
              variant="gray"
              size="1"
              css={{
                textTransform: "uppercase",
                fontWeight: 600,
              }}>
              {post.category.title}
            </Text>
            <Flex
              css={{
                alignItems: "center",
                pt: "$4",
                pb: "$5",
              }}>
              <Box
                css={{
                  position: "relative",
                  width: 30,
                  height: 30,
                  mr: "$2",
                }}>
                <Image
                  alt={post.author.image?.alt}
                  layout="fill"
                  objectFit="cover"
                  src={builder.image(post.author.image).url()}
                />
              </Box>
              <Box
                css={{
                  fontWeight: 600,
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}>
                {post.author.name}
              </Box>
              <Box
                css={{ mx: "$3", width: "1px", height: 16, bc: "$mauve9" }}
              />
              <Box
                css={{
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}>
                {stats.text}
              </Box>
            </Flex>
            <Heading
              size="2"
              as="h2"
              css={{
                fontWeight: 500,
                pb: "$3",
                transition: "color .3s",
              }}>
              {post.title}
            </Heading>
            <Box
              as={Text}
              variant="gray"
              size="4"
              css={{
                mb: "$3",
              }}>
              <TextTruncate
                line={5}
                element="span"
                truncateText="…"
                text={post.excerpt}
              />
            </Box>
          </Box>
          <A as={Box} css={{ fontWeight: 600, margin: 0 }}>
            Read more
          </A>
        </Flex>
      </A>
    </Link>
  );
};
