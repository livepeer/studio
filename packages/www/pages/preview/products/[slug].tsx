import Product from "../../products/[slug]";
import { GraphQLClient } from "graphql-request";
import { print } from "graphql/language/printer";
import allProducts from "../../../queries/allProducts.gql";

export default Product;

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

  let data: any = await graphQLClient.request(print(allProducts), {
    where: {
      _: { is_draft: true },
      slug: { current: { eq: slug } },
    },
  });

  // if in preview mode but no draft exists, then return published post
  if (!data.allProduct.length) {
    data = await graphQLClient.request(print(allProducts), {
      where: {
        _: { is_draft: false },
        slug: { current: { eq: slug } },
      },
    });
  }

  let product = data.allProduct.find((p) => p.slug.current === slug);

  return {
    props: {
      ...product,
      noindex: true,
      preview: true,
    },
  };
}
