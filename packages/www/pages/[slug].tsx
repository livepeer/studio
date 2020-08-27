import Fade from "react-reveal/Fade";
import Layout from "../components/Layout";
import { GraphQLClient, request } from "graphql-request";
import { print } from "graphql/language/printer";
import allPages from "../queries/allPages.gql";
import { getComponent } from "../lib/utils";
import { useRouter } from "next/router";
import { Spinner } from "@theme-ui/components";

const Page = ({ title, content, preview }) => {
  const router = useRouter();
  if (router.isFallback) {
    return (
      <Layout>
        <Spinner />
      </Layout>
    );
  }
  return (
    <Layout
      title={`${title} - Livepeer`}
      description={`Scalable, secure live transcoding at a fraction of the cost`}
      url={`https://livepeer.com`}
      preview={preview}
    >
      {content.map((component, i) => (
        <Fade key={i}>{getComponent(component)}</Fade>
      ))}
    </Layout>
  );
};

export async function getStaticPaths() {
  const { allPage } = await request(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default",
    print(allPages),
    {
      where: {}
    }
  );
  let paths = [];
  for (const page of allPage) {
    paths.push({ params: { slug: page.slug.current } });
  }
  return {
    fallback: true,
    paths
  };
}

export async function getStaticProps({ params, preview = false }) {
  const graphQLClient = new GraphQLClient(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default"
  );

  let data: any = await graphQLClient.request(print(allPages), {
    where: {
      slug: { current: { eq: params.slug } }
    }
  });

  return {
    props: {
      ...data.allPage[0],
      preview: false
    },
    revalidate: 1
  };
}

export default Page;
