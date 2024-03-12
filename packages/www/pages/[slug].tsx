import Fade from "react-reveal/Fade";
import Layout from "layouts/main";
import imageUrlBuilder from "@sanity/image-url";
import { getComponent } from "lib/utils";
import { useRouter } from "next/router";
import { Text, Box, Container } from "@livepeer/design-system";
import { client } from "lib/client";

const Page = ({
  title,
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
  console.log(title, content);
  if (router.isFallback) {
    return (
      <Layout>
        <Box
          css={{
            py: "$5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
          }}>
          Loading...
        </Box>
      </Layout>
    );
  }

  if (!content || !title) {
    return (
      <Layout>
        <Box
          css={{
            py: "$5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
          }}>
          Error
        </Box>
      </Layout>
    );
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
      <Box
        css={{
          ".pageComponent:nth-child(even)": {
            bc: "$neutral2",
          },
        }}>
        {content.map((component, i) => (
          <Box className="pageComponent" key={i}>
            {getComponent(component)}
          </Box>
        ))}
      </Box>
    </Layout>
  );
};

export async function getStaticPaths() {
  const queryForPaths = `*[_type in ["page", "solution"] && defined(slug.current)][].slug.current`;
  const data: string[] = (await client.fetch(queryForPaths)) ?? [];
  const paths = data
    .filter((path) => path !== "jobs" && path !== "team")
    .map((path) => ({ params: { slug: path } }));
  return {
    fallback: true,
    paths,
  };
}

export async function getStaticProps({ params, locale }) {
  const { slug } = params;
  const queryParams = {
    slug,
  };

  const query = `*[_type in ["page", "solution"]  && slug.current == $slug][0]`;
  const pageData = (await client.fetch(query, queryParams)) ?? {};

  return {
    props: {
      ...pageData,
    },
    revalidate: 5,
  };
}

Page.theme = "light-theme-green";
export default Page;
