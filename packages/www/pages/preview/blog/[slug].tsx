/** @jsxImportSource @emotion/react */
import { jsx } from "theme-ui";
import { GraphQLClient } from "graphql-request";
import { print } from "graphql/language/printer";
import allPosts from "../../../queries/allPosts.gql";
import Post from "../../blog/[slug]";

export const getServerSideProps = async ({ params }) => {
  const { slug } = params;
  const graphQLClient = new GraphQLClient(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default",
    {
      headers: {
        authorization: `Bearer ${process.env.SANITY_API_TOKEN}`,
      },
    }
  );

  let data: any = await graphQLClient.request(print(allPosts), {
    where: {
      _: { is_draft: true },
      slug: { current: { eq: slug } },
    },
  });

  // if in preview mode but no draft exists, then return published post
  if (!data.allPost.length) {
    data = await graphQLClient.request(print(allPosts), {
      where: {
        _: { is_draft: false },
        slug: { current: { eq: slug } },
      },
    });
  }

  let post = data.allPost.find((p) => p.slug.current === slug);

  return {
    props: {
      ...post,
      noindex: true,
      preview: true,
    },
  };
};

Post.theme = "light-theme-green";
export default Post;
