import Fade from "react-reveal/Fade";
import { Container, Flex, Box } from "@theme-ui/components";
import Layout from "../../components/Layout";
import { GraphQLClient } from "graphql-request";
import { print } from "graphql/language/printer";
import allPosts from "../../queries/allPosts.gql";
import imageUrlBuilder from "@sanity/image-url";
import client from "../../lib/client";
import readingTime from "reading-time";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/router";
import { Spinner } from "@theme-ui/components";
import React from "react";
import BlogPostImage from "../../components/renderers/BlogPostImage";
import { Grid } from "@theme-ui/components";
import BlogPostCard from "../../components/cards/BlogPost";
import Prefooter from "../../components/Prefooter";
import Link from "next/link";
import Code from "../../components/renderers/Code";

const Post = ({
  title,
  mainImage,
  author,
  category,
  _createdAt,
  excerpt,
  body,
  preview,
  furtherReading
}) => {
  const { isFallback, asPath } = useRouter();
  if (isFallback) {
    return (
      <Layout>
        <Spinner />
      </Layout>
    );
  }

  const stats = readingTime(body);
  const builder = imageUrlBuilder(client as any);
  return (
    <Layout
      title={`${title} - Livepeer.com`}
      description={excerpt}
      image={{ url: builder.image(mainImage).url(), alt: mainImage?.alt }}
      url={`https://livepeer.com${asPath}`}
      preview={preview}
    >
      <Container variant="blogPost" sx={{ my: 5 }}>
        <Flex
          sx={{
            mb: 2,
            alignItems: "center",
            fontSize: 1,
            justifyContent: "space-between"
          }}
        >
          <Box
            sx={{
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
              mr: 2
            }}
          >
            {new Date(_createdAt).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric"
            })}
          </Box>
          <Link
            href={category.title === "All" ? "/blog" : `/blog/category/[slug]`}
            as={
              category.title === "All"
                ? "/blog"
                : `/blog/category/${category.slug.current}`
            }
            passHref
          >
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
                  textDecoration: "underline"
                }
              }}
            >
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
                    mr: 2
                  }}
                  className="lazyload"
                  data-src={builder.image(author.image).url()}
                />
                <span
                  sx={{
                    fontWeight: 600,
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap"
                  }}
                >
                  {author.name}
                </span>
              </Box>
              <Box sx={{ mx: 2, width: "1px", height: 16, bg: "grey" }} />
              <Box
                sx={{
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap"
                }}
              >
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
          <ReactMarkdown
            source={body}
            renderers={{
              code: Code,
              image: BlogPostImage
            }}
          />
        </div>
        <hr sx={{ my: [5, 6] }} />
        <h3 sx={{ mb: 40 }}>Articles you may be interested in</h3>
        <Grid columns={[1, null, 2]} mb={5} gap={4}>
          {furtherReading.map((p, i) => (
            <BlogPostCard post={p} key={`post-${i}`} />
          ))}
        </Grid>
      </Container>
      <Fade key={0}>
        <Prefooter />
      </Fade>
    </Layout>
  );
};

export default Post;

export async function getServerSideProps({ params }) {
  const { slug } = params;
  const graphQLClient = new GraphQLClient(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default"
  );

  let { allPost: posts }: any = await graphQLClient.request(print(allPosts), {
    where: {}
  });

  const post = posts.find((p) => p.slug.current === slug);

  // TODO. should this be random?
  const furtherReading = posts
    .filter((p) => p.slug.current !== slug)
    .sort(() => 0.5 - Math.random())
    .slice(0, 2);

  return {
    props: {
      ...post,
      furtherReading
    }
  };
}
// export async function getStaticPaths() {
//   const graphQLClient = new GraphQLClient(
//     "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default"
//   );
//   const { allPost } = await graphQLClient.request(print(allPosts), {
//     where: {},
//   });

//   let paths = [];
//   for (const post of allPost) {
//     paths.push({ params: { slug: post.slug.current } });
//   }
//   return {
//     fallback: true,
//     paths,
//   };
// }

// export async function getStaticProps({ params, preview = false }) {
//   const graphQLClient = new GraphQLClient(
//     "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default"
//   );

//   let data: any = await graphQLClient.request(print(allPosts), {
//     where: {
//       slug: { current: { eq: params.slug } },
//     },
//   });

//   return {
//     props: {
//       ...data.allPost[0],
//       preview: false,
//     },
//     revalidate: 1,
//   };
// }
