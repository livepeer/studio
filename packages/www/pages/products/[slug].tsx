import Layout from "layouts/main";
import Hero from "@components/Marketing/Hero";
import Why from "@components/Marketing/Why";
import Prefooter from "@components/Marketing/Prefooter";
import { GraphQLClient, request } from "graphql-request";
import { print } from "graphql/language/printer";
import allProducts from "../../queries/allProducts.gql";
import { useRouter } from "next/router";
import { Box } from "@livepeer.com/design-system";
import client from "../../lib/client";
import imageUrlBuilder from "@sanity/image-url";

const Product = ({
  metaTitle,
  metaDescription,
  metaUrl,
  openGraphImage,
  hero,
  noindex = false,
  why,
  preview,
}) => {
  const { isFallback } = useRouter();
  const builder = imageUrlBuilder(client);

  if (isFallback) {
    return (
      <Layout>
        <Box
          sx={{
            py: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          Loading
        </Box>
      </Layout>
    );
  }

  return (
    <Layout
      title={metaTitle}
      description={metaDescription}
      noindex={noindex}
      image={
        openGraphImage
          ? {
              url: builder.image(openGraphImage).url(),
              alt: openGraphImage?.asset?.altText,
            }
          : null
      }
      url={metaUrl}
      preview={preview}>
      <Hero
        centered={hero.centered}
        tagline="Products"
        heading={hero.heading}
        description={hero.description}
        image={hero.image.asset?.url}
        ctas={[
          {
            href: "/register",
            children: "Start now",
          },
          {
            href: "/contact",
            children: "Get in touch",
          },
        ]}
      />

      <Why
        backgroundColor="$panel"
        title="Features"
        heading={why.heading}
        reasons={why.reasons}
      />

      <Prefooter />
    </Layout>
  );
};

export async function getStaticPaths() {
  const { allProduct } = await request(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default",
    print(allProducts),
    {
      where: {},
    }
  );
  let paths = [];
  for (const product of allProduct) {
    paths.push({ params: { slug: product.slug.current } });
  }

  return {
    fallback: true,
    paths,
  };
}

export async function getStaticProps({ params }) {
  const { slug } = params;

  const graphQLClient = new GraphQLClient(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default"
  );

  let data: any = await graphQLClient.request(print(allProducts), {
    where: {
      slug: { current: { eq: slug } },
    },
  });

  let product = data.allProduct.find((p) => p.slug.current === slug);

  return {
    props: {
      ...product,
    },
    revalidate: 1,
  };
}

export default Product;
