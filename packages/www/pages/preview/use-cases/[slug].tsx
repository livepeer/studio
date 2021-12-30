import UseCase from "../../use-cases/[slug]";
import { GraphQLClient } from "graphql-request";
import { print } from "graphql/language/printer";
import allUseCases from "../../../queries/allUseCases.gql";

export default UseCase;

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

  let data: any = await graphQLClient.request(print(allUseCases), {
    where: {
      _: { is_draft: true },
      slug: { current: { eq: slug } },
    },
  });

  // if in preview mode but no draft exists, then return published post
  if (!data.allUseCase.length) {
    data = await graphQLClient.request(print(allUseCases), {
      where: {
        _: { is_draft: false },
        slug: { current: { eq: slug } },
      },
    });
  }

  let useCase = data.allUseCase.find((p) => p.slug.current === slug);

  return {
    props: {
      ...useCase,
      noindex: true,
      preview: true,
    },
  };
}
