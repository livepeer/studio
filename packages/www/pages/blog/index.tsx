import { Box, Container, Flex, Grid, Link as A } from "@livepeer/design-system";
import { print } from "graphql/language/printer";
import { request } from "graphql-request";
import { useRouter } from "next/router";
import allCategories from "../../queries/allCategories.gql";
import allPosts from "../../queries/allPosts.gql";
import BlogPostCard, {
  FeaturedBlogPostCard,
} from "components/Site/BlogPostCard";
import Fade from "react-reveal/Fade";
import Layout from "layouts/main";
import Link from "next/link";
import { Blog as BlogContent } from "content";
import { client } from "lib/client";

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
        new Date(y.publishedDate).getTime() -
        new Date(x.publishedDate).getTime()
    )
    .find((p) => p.featured);

  // If no post is set as featured, default to the most recent post
  if (!featuredPost) {
    featuredPost = posts[0];
  }

  const seoData =
    asPath === "/blog"
      ? BlogContent.metaData
      : categories
          .filter((category) => category.slug.current === slug)
          .map((category) => ({
            title: category.metaTitle,
            description: category.metaDescription,
            url: category.metaUrl,
          }))?.[0];

  return (
    <Layout {...seoData}>
      <Box css={{ position: "relative" }}>
        <Container
          size="4"
          css={{
            px: "$3",
            py: "$2",
            width: "100%",
            "@bp2": {
              px: "$4",
            },
          }}>
          <Box
            css={{
              textAlign: "left",
              mt: 60,
              mb: 60,
              "@bp2": {
                mt: 110,
                mb: 120,
              },
            }}>
            <Box
              as="h1"
              css={{
                textTransform: "uppercase",
                fontSize: 70,
                fontWeight: 500,
                lineHeight: "82px",
                mx: 0,
                mt: 0,
                letterSpacing: "-4px",
                "@bp2": { fontSize: 130 },
              }}>
              Blog
            </Box>
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
              borderBottom: "1px solid $colors$neutral5",
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
                  passHref
                  legacyBehavior>
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
                        borderColor: isSelected ? "$blue9" : "transparent",
                        color: isSelected ? "$blue9" : "$hiContrast",
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
              mb: 100,
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
        </Container>
      </Box>
    </Layout>
  );
};

export async function getStaticProps() {
  // const client = getClient();

  const postsQuery = `*[_type=="post" && defined(hide) && hide ==false ]{
    ...,
    author->{...},
    category->{...},
    mainImage{
      asset->{...}
  }}`;
  const categoriesQuery = `*[_type=="category"]`;
  const categories = await client.fetch(categoriesQuery);
  const posts = await client.fetch(postsQuery);

  return {
    props: {
      categories,
      posts,
    },
    revalidate: 1,
  };
}

BlogIndex.theme = "dark-theme-blue";
export default BlogIndex;
