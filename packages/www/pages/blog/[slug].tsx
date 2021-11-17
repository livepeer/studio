import Fade from "react-reveal/Fade";
import {
  Container,
  Flex,
  Box,
  Heading,
  Grid,
  Link as A,
} from "@livepeer.com/design-system";
import { blocksToText } from "lib/utils";
import { GraphQLClient } from "graphql-request";
import { print } from "graphql/language/printer";
import { useRouter } from "next/router";
import allPosts from "../../queries/allPosts.gql";
import BlockContent from "@sanity/block-content-to-react";
import BlogPostCard from "@components/Marketing/BlogPostCard";
import client from "lib/client";
import Guides from "@components/Marketing/Guides";
import Image from "next/image";
import imageUrlBuilder from "@sanity/image-url";
import Layout from "layouts/main";
import Link from "next/link";
import Player from "@components/Marketing/BlogVideoPlayer";
import Prefooter from "@components/Marketing/Prefooter";
import React from "react";
import readingTime from "reading-time";
import SyntaxHighlighter from "react-syntax-highlighter";
import BlogCTA from "@components/Marketing/BlogCTA";

const serializers = {
  types: {
    code: (props) => (
      <SyntaxHighlighter language={props.node.language || "text"}>
        {props.node.code}
      </SyntaxHighlighter>
    ),
    cta: (props) => (
      <BlogCTA
        title={props.node.title}
        variant={props.node.variant}
        internalLink={props.node.internalLink}
        anchorLink={props.node.anchorLink}
        externalLink={props.node.externalLink}
      />
    ),
    "mux.video": (props) => <Player assetId={props.node.asset._ref} />,
  },
};

const Post = ({
  title,
  mainImage,
  author,
  category,
  _createdAt,
  excerpt,
  noindex = false,
  preview,
  contentRaw,
  furtherReading,
  metaTitle,
  metaDescription,
  metaUrl,
  openGraphImage,
}) => {
  const { isFallback, asPath } = useRouter();
  if (isFallback) {
    return (
      <Layout>
        <Box>Loading...</Box>
      </Layout>
    );
  }
  const text = blocksToText(contentRaw);
  const stats = readingTime(text);
  const builder = imageUrlBuilder(client as any);

  return (
    <Layout
      title={metaTitle}
      description={metaDescription}
      noindex={noindex}
      image={{
        url: builder.image(openGraphImage).url(),
        alt: openGraphImage?.alt,
      }}
      url={metaUrl}
      preview={preview}>
      <Guides backgroundColor="$mauve2" />
      <Box css={{ position: "relative" }}>
        <Container
          size="3"
          css={{
            px: "$6",
            py: "$7",
            width: "100%",
            "@bp3": {
              py: "$8",
              px: "$3",
            },
          }}>
          <Box css={{ maxWidth: 768, mx: "auto" }}>
            <Flex
              css={{
                mb: "$2",
                alignItems: "center",
                fontSize: "$2",
                justifyContent: "space-between",
              }}>
              <Box
                css={{
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  mr: "$2",
                }}>
                {new Date(_createdAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Box>
              <Link
                href={
                  category.title === "All" ? "/blog" : `/blog/category/[slug]`
                }
                as={
                  category.title === "All"
                    ? "/blog"
                    : `/blog/category/${category.slug.current}`
                }
                passHref>
                <A
                  css={{
                    color: "$hiContrast",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}>
                  {category.title}
                </A>
              </Link>
            </Flex>
            <Heading
              as="h1"
              size="3"
              css={{
                mt: "$3",
                mb: "$6",
                fontWeight: 600,
              }}>
              {title}
            </Heading>
            <Flex align="center" css={{ fontSize: "$3", mb: "$6" }}>
              <Flex align="center">
                By
                <Box
                  css={{
                    ml: "$3",
                    mr: "$2",
                    position: "relative",
                    borderRadius: 1000,
                    width: 32,
                    height: 32,
                    overflow: "hidden",
                  }}>
                  <Image
                    alt={author.image?.alt}
                    layout="fill"
                    objectFit="cover"
                    src={builder.image(author.image).url()}
                  />
                </Box>
                <Box
                  as="span"
                  css={{
                    fontWeight: 600,
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}>
                  {author.name}
                </Box>
              </Flex>
              <Box
                css={{ mx: "$2", width: "1px", height: 16, bc: "$mauve2" }}
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
            <Box
              css={{
                position: "relative",
                maxHeight: 300,
                height: 500,
                width: "100%",
                borderRadius: 16,
                overflow: "hidden",
                mb: "$7",
              }}>
              <Image
                alt={mainImage?.alt}
                layout="fill"
                objectFit="cover"
                src={builder.image(mainImage).url()}
              />
            </Box>
            <Box
              css={{
                "p, div, ul, li": {
                  lineHeight: 1.8,
                  color: "$hiContrast",
                },
                "h1, h2, h3, h4, h5, h6": {
                  color: "$hiContrast",
                  lineHeight: 1.5,
                },
                strong: {
                  color: "$hiContrast",
                },
                em: {
                  color: "$hiContrast",
                },
                figure: {
                  m: 0,
                },
                img: {
                  width: "100%",
                },
                a: {
                  color: "$violet9",
                },
              }}>
              <BlockContent
                blocks={contentRaw}
                serializers={serializers}
                {...client.config()}
              />
            </Box>
            {!!furtherReading && (
              <>
                <Box
                  css={{
                    bc: "$mauve5",
                    height: "1px",
                    width: "100%",
                    my: "$8",
                  }}
                />
                <Heading size="2" as="h3" css={{ mb: "$6" }}>
                  Articles you may be interested in
                </Heading>
                <Grid
                  gap={4}
                  css={{
                    mb: "$5",
                    gridTemplateColumns: "repeat(1,1fr)",
                    "@bp2": {
                      gridTemplateColumns: "repeat(2,1fr)",
                    },
                  }}>
                  {furtherReading.map((p, i) => (
                    <BlogPostCard post={p} key={`post-${i}`} />
                  ))}
                </Grid>
              </>
            )}
          </Box>
        </Container>
      </Box>
      <Fade key={0}>
        <Prefooter />
      </Fade>
    </Layout>
  );
};

export default Post;

export async function getStaticPaths() {
  const graphQLClient = new GraphQLClient(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default"
  );
  const { allPost } = await graphQLClient.request(print(allPosts), {
    where: {},
  });

  let paths = [];
  for (const post of allPost) {
    paths.push({ params: { slug: post.slug.current } });
  }
  return {
    fallback: true,
    paths,
  };
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  const graphQLClient = new GraphQLClient(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default"
  );

  let data: any = await graphQLClient.request(print(allPosts), {
    where: {},
  });

  let post = data.allPost.find((p) => p.slug.current === slug);

  // TODO: fetch related posts from sanity
  const furtherReading = data.allPost
    .filter((p) => p.slug.current !== slug)
    .sort(() => 0.5 - Math.random())
    .slice(0, 2);

  return {
    props: {
      ...post,
      furtherReading,
    },
    revalidate: 1,
  };
}
