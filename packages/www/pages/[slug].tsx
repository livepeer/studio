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
      <Container
        size="3"
        css={{
          px: "$3",
          py: "$7",
          width: "100%",
          "@bp3": {
            px: "$4",
          },
        }}>
        <Text
          size="8"
          as="h1"
          css={{
            textTransform: "uppercase",
            mb: "$7",
            fontWeight: 700,
            width: 150,
            lineHeight: "30px",
            textAlign: "center",
            mx: "auto",
          }}>
          Livepeer Studio
        </Text>
        <Box
          css={{
            width: "100%",
            maxWidth: 600,
            height: "1px",
            mb: "$3",
            mx: "auto",
            mt: "$4",
            background:
              "linear-gradient(to right,transparent,rgba(255,255,255,0.1) 50%,transparent)",
          }}
        />
        {content.map((component, i) => (
          <Fade key={i}>{getComponent(component)}</Fade>
        ))}
      </Container>
    </Layout>
  );
};

export async function getStaticPaths() {
  const queryForPaths = `*[_type=='page' && defined(slug.current)][].slug.current`;
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

  const query = `*[_type=="page" && slug.current == $slug][0]`;
  const pageData = (await client.fetch(query, queryParams)) ?? {};

  return {
    props: {
      ...pageData,
    },
    revalidate: 86400,
  };
}

Page.theme = "light-theme-green";
export default Page;
