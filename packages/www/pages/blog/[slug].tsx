import { Container, Flex, Box, Link as A } from "@theme-ui/components";
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

const Post = ({
  title,
  mainImage,
  author,
  category,
  _createdAt,
  excerpt,
  body,
  preview,
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
      title={`${title} - Livepeer`}
      description={excerpt}
      image={{ url: builder.image(mainImage).url(), alt: mainImage?.alt }}
      url={`https://livepeer.com${asPath}`}
      preview={preview}
    >
      <Box
        sx={{
          mb: 5,
          background: [
            "none",
            "none",
            "none",
            "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 45%, rgba(148, 60, 255,.08) 45%, rgba(255,255,255,.3) 100%);",
          ],
        }}
      >
        <Container
          sx={{
            flexDirection: ["column", "column", "column", "row"],
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              width: "100%",
              maxWidth: 800,
              py: [40, 40, 40, 100],
              mr: [0, 0, 0, 5],
            }}
          >
            <img
              alt={mainImage?.alt}
              width={700}
              height={400}
              sx={{
                mt: [2, 0],
                height: [300, 300, 400],
                maxHeight: [300, 300, 400],
                width: "100%",
                objectFit: "cover",
              }}
              className="lazyload"
              data-src={builder.image(mainImage).url()}
            />
          </Box>
          <Box
            sx={{
              flexGrow: 0,
              flexBasis: ["initial", "initial", "initial", 950],
            }}
          >
            <Flex sx={{ mb: 2, alignItems: "center", fontSize: 1 }}>
              <Box>
                {new Date(_createdAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Box>
              <Box sx={{ mx: 3, width: "1px", height: 16, bg: "grey" }} />
              <Box>{category.title}</Box>
            </Flex>
            <h1 sx={{ fontSize: [32, 32, 48], my: 3 }}>{title}</h1>
            <Flex sx={{ alignItems: "center" }}>
              <Flex sx={{ alignItems: "center" }}>
                <img
                  alt={author.image?.alt}
                  width={40}
                  height={40}
                  sx={{
                    mt: [2, 0],
                    height: 40,
                    width: 40,
                    borderRadius: 1000,
                    objectFit: "cover",
                    mr: 3,
                  }}
                  className="lazyload"
                  data-src={builder.image(author.image).url()}
                />

                <Box>
                  <Flex sx={{ alignItems: "center", fontSize: 1 }}>
                    <Box>By {author.name}</Box>
                    <Box sx={{ mx: 3, width: "1px", height: 16, bg: "grey" }} />
                    <Box>{stats.text}</Box>
                  </Flex>
                </Box>
              </Flex>
            </Flex>
          </Box>
        </Container>
      </Box>
      <Container
        className="markdown-body"
        sx={{ pb: 6, maxWidth: 768, margin: "0 auto" }}
      >
        <ReactMarkdown>{body}</ReactMarkdown>
      </Container>
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

export async function getStaticProps({ params, preview = false }) {
  const graphQLClient = new GraphQLClient(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default",
    {
      ...(preview && {
        headers: {
          authorization: `Bearer ${process.env.SANITY_API_TOKEN}`,
        },
      }),
    }
  );

  let data: any = await graphQLClient.request(print(allPosts), {
    where: {
      _: { is_draft: preview },
      slug: { current: { eq: params.slug } },
    },
  });

  // if in preview mode but no draft exists, then return published post
  if (preview && !data?.allPost?.length) {
    data = await graphQLClient.request(print(allPosts), {
      where: {
        _: { is_draft: false },
        slug: { current: { eq: params.slug } },
      },
    });
  }

  return {
    props: {
      ...data.allPost[0],
      preview,
    },
    revalidate: 1,
  };
}
