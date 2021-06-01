/** @jsx jsx */
import { jsx } from "theme-ui";
import Fade from "react-reveal/Fade";
import { Container, Flex, Box } from "@theme-ui/components";
import Layout from "../../layouts";
import { GraphQLClient } from "graphql-request";
import { print } from "graphql/language/printer";
import allPosts from "../../queries/allPosts.gql";
import imageUrlBuilder from "@sanity/image-url";
import client from "../../lib/client";
import readingTime from "reading-time";
import { useRouter } from "next/router";
import { Spinner } from "@theme-ui/components";
import React from "react";
import BlogPostImage from "../../components/renderers/BlogPostImage";
import { Grid } from "@theme-ui/components";
import BlogPostCard from "../../components/cards/BlogPost";
import Prefooter from "../../components/Prefooter";
import Link from "next/link";
import BlockContent from "@sanity/block-content-to-react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { blocksToText } from "../../lib/utils";
import Player from "../../components/BlogVideoPlayer";

const serializers = {
  types: {
    code: (props) => (
      <SyntaxHighlighter language={props.node.language || "text"}>
        {props.node.code}
      </SyntaxHighlighter>
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
}) => {
  const { isFallback, asPath } = useRouter();
  if (isFallback) {
    return (
      <Layout>
        <Spinner />
      </Layout>
    );
  }
  const text = blocksToText(contentRaw);
  const stats = readingTime(text);
  const builder = imageUrlBuilder(client as any);
  return (
    <Layout
      title={`${title} - Livepeer.com`}
      description={excerpt}
      noindex={noindex}
      image={{ url: builder.image(mainImage).url(), alt: mainImage?.alt }}
      url={`https://livepeer.com${asPath}`}
      preview={preview}>
      <Container variant="blogPost" sx={{ my: 5 }}>
        <Flex
          sx={{
            mb: 2,
            alignItems: "center",
            fontSize: 1,
            justifyContent: "space-between",
          }}>
          <Box
            sx={{
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
              mr: 2,
            }}>
            {new Date(_createdAt).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Box>
          <Link
            href={category.title === "All" ? "/blog" : `/blog/category/[slug]`}
            as={
              category.title === "All"
                ? "/blog"
                : `/blog/category/${category.slug.current}`
            }
            passHref>
            <Box
              as="a"
              sx={{
                color: "text",
                textTransform: "uppercase",
                lineHeight: "15px",
                fontSize: "12px",
                letterSpacing: "-0.02em",
                fontWeight: 600,
                "&:hover": {
                  textDecoration: "underline",
                },
              }}>
              {category.title}
            </Box>
          </Link>
        </Flex>
        <h1 sx={{ fontSize: [32, null, 40], my: 3 }}>{title}</h1>
        <Flex sx={{ alignItems: "center" }}>
          <Box>
            <Flex sx={{ alignItems: "center", fontSize: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                By{" "}
                <img
                  alt={author.image?.alt}
                  width={40}
                  height={40}
                  sx={{
                    height: 32,
                    width: 32,
                    borderRadius: 1000,
                    objectFit: "cover",
                    ml: 3,
                    mr: 2,
                  }}
                  className="lazyload"
                  data-src={builder.image(author.image).url()}
                />
                <span
                  sx={{
                    fontWeight: 600,
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}>
                  {author.name}
                </span>
              </Box>
              <Box sx={{ mx: 2, width: "1px", height: 16, bg: "grey" }} />
              <Box
                sx={{
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}>
                {stats.text}
              </Box>
            </Flex>
          </Box>
        </Flex>
        <BlogPostImage
          alt={mainImage?.alt}
          width={700}
          height={400}
          className="lazyload"
          data-src={builder.image(mainImage).url()}
        />
        <div className="markdown-body">
          <BlockContent
            blocks={contentRaw}
            serializers={serializers}
            {...client.config()}
          />
        </div>
        {!!furtherReading && (
          <>
            <hr sx={{ my: [5, 6] }} />
            <h3 sx={{ mb: 40 }}>Articles you may be interested in</h3>
            <Grid columns={[1, null, 2]} mb={5} gap={4}>
              {furtherReading.map((p, i) => (
                <BlogPostCard post={p} key={`post-${i}`} />
              ))}
            </Grid>
          </>
        )}
      </Container>
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
    fallback: !process.env.LP_STATIC_BUILD,
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
