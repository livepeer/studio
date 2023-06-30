import readingTime from "reading-time";
import { blocksToText } from "lib/utils";
import Link from "next/link";
import { Flex, Box, Text, Heading, Link as A } from "@livepeer/design-system";
import imageUrlBuilder from "@sanity/image-url";
import { client } from "lib/client";
import Image from "next/image";
import TextTruncate from "react-text-truncate";
import { urlFor } from "lib/sanity";

const BlogPostCard = ({ post, css = {} }) => {
  const text = blocksToText(post.content);
  const stats = readingTime(text);
  return (
    <Link
      href="/blog/[slug]"
      as={`/blog/${post.slug.current}`}
      passHref
      legacyBehavior>
      <A
        css={{
          display: "inline-flex",
          flexDirection: "column",
          bc: "$loContrast",
          width: "100%",
          textDecoration: "none",
          color: "initial",
          marginRight: "auto",
          borderRadius: 18,
          overflow: "hidden",
          transition: "box-shadow .2s",
          height: 600,
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
              img: {
                objectPosition: "left",
              },
            }}>
            <Image
              src={urlFor(post.mainImage).url()}
              alt={post.mainImage?.alt}
              fill
              style={{ objectFit: "cover" }}
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
            color: "$loContrast",
            bc: "$hiContrast",
          }}>
          <Box>
            <Text
              size="2"
              css={{
                color: "$loContrast",
                textTransform: "uppercase",
                fontWeight: 500,
              }}>
              {post.category?.title ?? ""}
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
                  borderRadius: 1000,
                  overflow: "hidden",
                }}>
                <Image
                  alt={post.author.image?.alt}
                  src={urlFor(post.author.image).url()}
                  fill
                  style={{ objectFit: "cover" }}
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
                css={{ mx: "$3", width: "1px", height: 16, bc: "$primary9" }}
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
              size="2"
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
              size="4"
              css={{
                color: "$loContrast",
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
          <A
            as={Box}
            css={{
              textDecoration: "none",
              fontWeight: 500,
              margin: 0,
              color: "$loContrast",
            }}>
            Read more
          </A>
        </Flex>
      </A>
    </Link>
  );
};

export default BlogPostCard;
export { FeaturedBlogPostCard } from "./Featured";
