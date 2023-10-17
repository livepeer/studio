import { client } from "lib/client";
import BlogIndex from "../index";

export async function getStaticPaths() {
  const categoriesQuery = `*[_type=="category" && defined(slug.current)][].slug.current`;
  const categories = (await client.fetch(categoriesQuery)) ?? [];
  const paths = categories.map((category) => ({ params: { slug: category } }));

  return {
    fallback: true,
    paths,
  };
}

export async function getStaticProps({ params }) {
  const { slug } = params;

  const queryParams = {
    slug,
  };
  const postQuery = `*[_type == "post" && defined(hide) && hide ==false && category._ref in (*[_type == "category" && slug.current == $slug]._id)]{
    ...,
    author->{...},
    category->{...},
    mainImage{
      asset->{...}
    },
    }`;
  const posts = (await client.fetch(postQuery, queryParams)) ?? [];

  const categoriesQuery = `*[_type=="category"]`;
  const categories = await client.fetch(categoriesQuery);

  return {
    props: {
      categories,
      posts,
    },
    revalidate: 1,
  };
}

BlogIndex.theme = "light-theme-green";
export default BlogIndex;
