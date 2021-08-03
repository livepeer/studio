import {
  Box,
  Container,
  Flex,
  Grid,
  Heading,
  Link as A,
  Text,
} from "@livepeer.com/design-system";
import { print } from "graphql/language/printer";
import { request } from "graphql-request";
import { useRouter } from "next/router";
import allCategories from "../../queries/allCategories.gql";
import allPosts from "../../queries/allPosts.gql";
import BlogPostCard, {
  FeaturedBlogPostCard,
} from "@components/Redesign/BlogPostCard";
import Fade from "react-reveal/Fade";
import Layout from "layouts/redesign";
import Link from "next/link";
import Prefooter from "components/Redesign/Prefooter";
import Guides from "components/Redesign/Guides";

const BlogIndex = ({ categories, posts }) => {
  const router = useRouter();
  const {
    query: { slug },
    asPath,
  } = router;

  if (router.isFallback) {
    return (
      <Layout>
        <Box>Loading...</Box>
      </Layout>
    );
  }

  let featuredPost = posts
    .sort(
      (x, y) =>
        new Date(y._createdAt).getTime() - new Date(x._createdAt).getTime()
    )
    .find((p) => p.featured);

  // If no post is set as featured, default to the most recent post
  if (!featuredPost) {
    featuredPost = posts[0];
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  return (
    <Layout
      title={`Blog - ${
        slug ? capitalizeFirstLetter(slug) + " Category - " : ""
      }Livepeer.com`}
      description={`Blog posts from the Livepeer.com team and community. Discover the latest in video development.`}
      url={`https://livepeer.com${asPath}`}>
      <Guides />
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
          <Box css={{ textAlign: "center", mb: "$8" }}>
            <Heading as="h1" size="4" css={{ fontWeight: 600, mb: "$5" }}>
              Blog
            </Heading>
            <Text as="h2" variant="gray" size="6">
              Welcome to the Livepeer.com blog.
            </Text>
          </Box>

          {featuredPost && (
            <Box
              css={{
                mb: 80,
                display: "none",
                "@bp2": {
                  display: "block",
                },
              }}>
              <FeaturedBlogPostCard post={featuredPost} />
            </Box>
          )}
          <Flex
            css={{
              borderBottom: "1px solid $colors$mauve5",
              alignItems: "center",
              mb: "$6",
              overflow: "auto",
            }}>
            {categories.map((c, i) => {
              const isSelected =
                slug === c.slug.current || (!slug && c.title === "All");
              return (
                <Link
                  key={i}
                  href={c.title === "All" ? "/blog" : `/blog/category/[slug]`}
                  as={
                    c.title === "All"
                      ? "/blog"
                      : `/blog/category/${c.slug.current}`
                  }
                  passHref>
                  <A
                    css={{
                      display: "block",
                      textDecoration: "none",
                      ":hover": {
                        textDecoration: "none",
                      },
                    }}>
                    <Box
                      key={i + 1}
                      css={{
                        borderBottom: "2px solid",
                        borderColor: isSelected ? "$violet9" : "transparent",
                        color: isSelected ? "$violet9" : "$hiContrast",
                        fontWeight: isSelected ? 600 : 500,
                        pb: "$3",
                        mr: "$6",
                      }}>
                      {c.title}
                    </Box>
                  </A>
                </Link>
              );
            })}
          </Flex>
          <Grid
            gap={4}
            css={{
              mb: "$5",
              gridTemplateColumns: "repeat(1,1fr)",
              "@bp2": {
                gridTemplateColumns: "repeat(2,1fr)",
              },
              "@bp3": {
                gridTemplateColumns: "repeat(3,1fr)",
              },
            }}>
            {posts.map((p, i) => (
              <BlogPostCard
                post={p}
                css={{
                  display:
                    p._id === featuredPost._id
                      ? ["block", null, "none"]
                      : undefined,
                }}
                key={`post-${i}`}
              />
            ))}
          </Grid>

          <Fade key={0}>
            <Prefooter />
          </Fade>
        </Container>
      </Box>
    </Layout>
  );
};

export async function getStaticProps({ params }) {
  const { allCategory: categories } = await request(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default",
    print(allCategories)
  );
  categories.push({ title: "All", slug: { current: "" } });
  const { allPost: posts } = await request(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default",
    print(allPosts),
    { where: {} }
  );

  return {
    props: {
      categories: categories.reverse(),
      posts,
    },
    revalidate: 1,
  };
}

export default BlogIndex;
