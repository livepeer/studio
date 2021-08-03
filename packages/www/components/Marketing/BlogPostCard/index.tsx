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

const BlogPostCard = ({ post, css = {} }) => {
  const text = blocksToText(post.contentRaw);
  const stats = readingTime(text);
  const builder = imageUrlBuilder(client as any);

  return (
    <Link href="/blog/[slug]" as={`/blog/${post.slug.current}`} passHref>
      <A
        css={{
          display: "inline-flex",
          flexDirection: "column",
          bc: "$loContrast",
          width: "100%",
          textDecoration: "none",
          color: "initial",
          marginRight: "auto",
          borderRadius: 24,
          border: "1px solid",
          borderColor: "$mauve5",
          overflow: "hidden",
          transition: "box-shadow .2s",
          height: 540,
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
              width: "100%",
              height: 200,
              minHeight: 200,
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
            flexDirection: "column",
            justifyContent: "space-between",
            px: "$4",
            py: "$4",
            height: "100%",
          }}>
          <Box>
            <Text
              variant="gray"
              size="1"
              css={{
                textTransform: "uppercase",
                fontWeight: 500,
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
                  mr: "$2",
                  position: "relative",
                  width: 30,
                  height: 30,
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
              as="h2"
              size="1"
              css={{
                fontWeight: 500,
                pb: "$3",
                transition: "color .3s",
              }}>
              <TextTruncate
                line={4}
                element="span"
                truncateText="…"
                text={post.title}
              />
            </Heading>
            <Text
              variant="gray"
              size="4"
              css={{
                mb: "$5",
              }}>
              <TextTruncate
                line={3}
                element="span"
                truncateText="…"
                text={post.excerpt}
              />
            </Text>
          </Box>
          <Text css={{ fontWeight: 600, margin: 0 }}>Read more</Text>
        </Flex>
      </A>
    </Link>
  );
};

export default BlogPostCard;
export { FeaturedBlogPostCard } from "./Featured";
