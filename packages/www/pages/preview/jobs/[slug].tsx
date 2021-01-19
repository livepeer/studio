import Job from "../../jobs/[slug]";
import { GraphQLClient } from "graphql-request";
import { print } from "graphql/language/printer";
import allJobs from "../../../queries/allJobs.gql";

export default Job;

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

  let data: any = await graphQLClient.request(print(allJobs), {
    where: {
      _: { is_draft: true },
      slug: { current: { eq: slug } },
    },
  });

  // if in preview mode but no draft exists, then return published post
  if (!data.allJob.length) {
    data = await graphQLClient.request(print(allJobs), {
      where: {
        _: { is_draft: false },
        slug: { current: { eq: slug } },
      },
    });
  }

  let job = data.allJob.find((j) => j.slug.current === slug);

  return {
    props: {
      ...job,
      noindex: true,
      preview: true,
    },
  };
}
