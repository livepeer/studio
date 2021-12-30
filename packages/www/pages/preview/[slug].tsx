/** @jsx jsx */
import { jsx } from "theme-ui";
import Page from "../[slug]";
import { GraphQLClient } from "graphql-request";
import { print } from "graphql/language/printer";
import allPages from "../../queries/allPages.gql";

export default Page;

export async function getServerSideProps({ params }) {
  const { slug } = params;
  const graphQLClient = new GraphQLClient(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default",
    {
      headers: {
        authorization: `Bearer ${process.env.SANITY_API_TOKEN}`,
      },
    }
  );

  let data: any = await graphQLClient.request(print(allPages), {
    where: {
      _: { is_draft: true },
      slug: { current: { eq: slug } },
    },
  });

  // if in preview mode but no draft exists, then return published post
  if (!data.allPage.length) {
    data = await graphQLClient.request(print(allPages), {
      where: {
        _: { is_draft: false },
        slug: { current: { eq: slug } },
      },
    });
  }

  let page = data.allPage.find((p) => p.slug.current === slug);

  return {
    props: {
      ...page,
      noindex: true,
      preview: true,
    },
  };
}
