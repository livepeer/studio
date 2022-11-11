import Fade from "react-reveal/Fade";
import Layout from "layouts/main";
import client from "lib/client";
import imageUrlBuilder from "@sanity/image-url";
import DefaultError from "components/Site/DefaultError";
import { GraphQLClient, request } from "graphql-request";
import { print } from "graphql/language/printer";
import allPages from "../queries/allPages.gql";
import { getComponent } from "lib/utils";
import { useRouter } from "next/router";
import { Box } from "@livepeer/design-system";

const Page = ({
  title,
  slug,
  metaTitle,
  metaDescription,
  metaUrl,
  openGraphImage,
  content,
  noindex = false,
  preview,
}) => {
  const router = useRouter();
  const builder = imageUrlBuilder(client as any);

  if (router.isFallback) {
    return (
      <Layout>
        <Box
          css={{
            py: "$5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          Loading...
        </Box>
      </Layout>
    );
  }

  if (!content || !title) {
    return <DefaultError />;
  }

  return (
    <Layout
      title={metaTitle}
      description={metaDescription}
      noindex={noindex}
      image={{
        url: builder.image(openGraphImage).url(),
        alt: openGraphImage?.asset?.altText,
      }}
      url={metaUrl}
      preview={preview}>
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
      where: {},
    }
  );
  let paths = [];
  for (const page of allPage) {
    paths.push({ params: { slug: page.slug.current } });
  }

  paths = paths.filter(
    (p) => p.params.slug !== "jobs" && p.params.slug !== "team"
  );
  return {
    fallback: true,
    paths,
  };
}

export async function getStaticProps({ params, locale }) {
  const id = {
    en: "",
    es: "i18n_es-ES",
  };

  const { slug } = params;
  const graphQLClient = new GraphQLClient(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default"
  );

  const variables = {
    where: { slug: { current: { eq: slug } }, _id: { matches: id[locale] } },
  };

  let data: any = await graphQLClient.request(print(allPages), variables);

  let page = data.allPage.find((p) => p.slug.current === slug);
  return {
    props: {
      ...page,
    },
    revalidate: 1,
  };
}

Page.theme = "dark-theme-blue";
export default Page;
