/** @jsx jsx */
import { jsx } from "theme-ui";
import { request } from "graphql-request";
import { print } from "graphql/language/printer";
import allCategories from "../../../queries/allCategories.gql";
import allPosts from "../../../queries/allPosts.gql";
import BlogIndex from "../index";

export async function getStaticPaths() {
  const { allCategory } = await request(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default",
    print(allCategories)
  );
  let paths = [];
  for (const category of allCategory) {
    paths.push({ params: { slug: category.slug.current } });
  }
  return {
    fallback: true,
    paths,
  };
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  const { allCategory: categories } = await request(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default",
    print(allCategories)
  );
  categories.push({ title: "All", slug: { current: "" } });
  const { allPost: posts } = await request(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default",
    print(allPosts),
    { where: { category: { slug: { current: { eq: slug } } } } }
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
