import Layout from "../../components/Layout";
import { request } from "graphql-request";
import { print } from "graphql/language/printer";
import allCategories from "../../queries/allCategories.gql";
import allPosts from "../../queries/allPosts.gql";
import { Container, Flex, Box, Link as A, Spinner } from "@theme-ui/components";
import Link from "next/link";
import { useRouter } from "next/router";
import BlogPostCard from "../../components/cards/BlogPost";
import { Grid } from "@theme-ui/components";

const BlogIndex = ({ categories, posts }) => {
  const router = useRouter();
  const { slug } = router.query;

  if (router.isFallback) {
    return (
      <Layout>
        <Spinner />
      </Layout>
    );
  }

  return (
    <Layout
      title={`Blog - Livepeer.com`}
      description={`Blog posts from the Livepeer.com team and community. Discover the latest in video development.`}
      url={`https://livepeer.com/blog`}
      withGradientBackground
    >
      <Container sx={{ textAlign: "center", maxWidth: 900, mb: 6 }}>
        <h1 sx={{ lineHeight: "72px", mt: 5, mb: 3, fontSize: 8 }}>
          Livepeer Blog
        </h1>
        <p sx={{ lineHeight: "32px", fontSize: 3, color: "text" }}>
          Read the latest updates of Livepeer.
        </p>
      </Container>
      <Container
        sx={{
          pb: 5,
          ul: { mb: 4 },
          p: { mb: 4 },
          margin: "0 auto"
        }}
      >
        <Flex
          sx={{
            borderBottom: "1px solid rgba(55,54,77,.1)",
            alignItems: "center",
            mb: 4
          }}
        >
          {categories.map((c, i) => (
            <Link
              key={i}
              href={c.title === "All" ? "/blog" : `/blog/category/[slug]`}
              as={
                c.title === "All" ? "/blog" : `/blog/category/${c.slug.current}`
              }
              passHref
            >
              <A
                sx={{
                  display: "block",
                  color: "black",
                  textDecoration: "none",
                  ":hover": {
                    textDecoration: "none"
                  }
                }}
              >
                <Box
                  key={i + 1}
                  sx={{
                    borderBottom: `2px solid  ${
                      slug === c.slug.current || (!slug && c.title === "All")
                        ? "black"
                        : "transparent"
                    }`,
                    pb: 3,
                    mr: 4
                  }}
                >
                  {c.title}
                </Box>
              </A>
            </Link>
          ))}
        </Flex>
        <Grid columns={[1, 2, 3]}>
          {posts.map((p, i) => (
            <BlogPostCard post={p} key={`post-${i}`} />
          ))}
        </Grid>
      </Container>
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
    allPost: posts
  } = await request(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default",
    print(allPosts),
    { where: {} }
  );

  return {
    props: {
      categories: categories.reverse(),
      posts
    },
    revalidate: 1
  };
}

export default BlogIndex;
