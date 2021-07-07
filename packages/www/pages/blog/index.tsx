/** @jsx jsx */
import { jsx } from "theme-ui";
import Fade from "react-reveal/Fade";
import Layout from "../../layouts";
import { request } from "graphql-request";
import { print } from "graphql/language/printer";
import allCategories from "../../queries/allCategories.gql";
import allPosts from "../../queries/allPosts.gql";
import { Container, Flex, Box, Link as A, Spinner } from "@theme-ui/components";
import Link from "next/link";
import { useRouter } from "next/router";
import BlogPostCard from "../../components/cards/BlogPost";
import { Grid } from "@theme-ui/components";
import Prefooter from "../../components/Prefooter";
import FeaturedBlogPostCard from "../../components/cards/FeaturedBlogPost";

const BlogIndex = ({ categories, posts }) => {
  const router = useRouter();
  const {
    query: { slug },
    asPath,
  } = router;

  if (router.isFallback) {
    return (
      <Layout>
        <Spinner />
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
      url={`https://livepeer.com${asPath}`}
      withGradientBackground>
      <Container variant="hero">
        <Box as="h1" sx={{ variant: "text.heading.hero" }}>
          Blog
        </Box>
        <Box as="p" sx={{ variant: "text.heroDescription" }}>
          Welcome to the Livepeer.com blog.
        </Box>
      </Container>
      <Container>
        {featuredPost && (
          <Box sx={{ mb: "80px", display: ["none", null, "block"] }}>
            <FeaturedBlogPostCard post={featuredPost} />
          </Box>
        )}
        <Flex
          sx={{
            borderBottom: "1px solid rgba(55,54,77,.1)",
            alignItems: "center",
            mb: 4,
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
                  sx={{
                    display: "block",
                    color: "black",
                    textDecoration: "none",
                    ":hover": {
                      textDecoration: "none",
                    },
                  }}>
                  <Box
                    key={i + 1}
                    sx={{
                      borderBottom: "2px solid",
                      borderColor: isSelected ? "primary" : "transparent",
                      color: isSelected ? "primary" : "text",
                      fontWeight: isSelected ? 600 : 500,
                      pb: 3,
                      mr: 4,
                    }}>
                    {c.title}
                  </Box>
                </A>
              </Link>
            );
          })}
        </Flex>
        <Grid columns={[1, null, 2, null, 3]} mb={5} gap={4}>
          {posts.map((p, i) => (
            <BlogPostCard
              post={p}
              pushSx={{
                display:
                  p._id === featuredPost._id
                    ? ["block", null, "none"]
                    : undefined,
              }}
              key={`post-${i}`}
            />
          ))}
        </Grid>
      </Container>
      <Fade key={0}>
        <Prefooter />
      </Fade>
    </Layout>
  );
};

export async function getStaticProps({ params }) {
  const { allCategory: categories } = await request(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default",
    print(allCategories)
  );
  categories.push({ title: "All", slug: { current: "" } });
  const {
    allPost: posts,
  } = await request(
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
