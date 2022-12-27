import { getClient } from "lib/sanity.server";
import { groq } from "next-sanity";
import BlogIndex from "../index";

export async function getStaticPaths() {
  const client = getClient();
  const categoriesQuery = groq`*[_type=="category" && defined(slug.current)][].slug.current`;
  const categories = (await client.fetch(categoriesQuery)) ?? [];
  const paths = categories.map((category) => ({ params: { slug: category } }));

  return {
    fallback: true,
    paths,
  };
}

export async function getStaticProps({ params }) {
  const { slug } = params;
  const client = getClient();
  const queryParams = {
    slug,
  };
  const postQuery = groq`*[_type == "post" && category._ref in (*[_type == "category" && slug.current == $slug]._id)]{
    ...,
    author->{...},
    category->{...},
    mainImage{
      asset->{...}
    },
    }`;
  const posts = (await client.fetch(postQuery, queryParams)) ?? [];

  const categoriesQuery = groq`*[_type=="category"]`;
  const categories = await client.fetch(categoriesQuery);

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
