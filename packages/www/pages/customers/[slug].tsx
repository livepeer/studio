import {
  Container,
  Flex,
  Box,
  Text,
  Heading,
  Link as A,
} from "@livepeer/design-system";
import { useRouter } from "next/router";
import { client } from "lib/client";
import Layout from "layouts/main";
import React from "react";
import { urlFor } from "lib/sanity";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

const Customer = ({
  title,
  noindex = false,
  preview,
  body,
  endorserName,
  endorserRole,
  metaTitle,
  metaDescription,
  metaUrl,
  openGraphImage,
}) => {
  const { isFallback } = useRouter();
  if (isFallback) {
    return (
      <Layout>
        <Box>Loading...</Box>
      </Layout>
    );
  }
  console.log(body);
  return (
    <Layout
      title={metaTitle}
      description={metaDescription}
      noindex={noindex}
      image={{
        url: urlFor(openGraphImage).url(),
        alt: openGraphImage?.alt,
      }}
      url={metaUrl}
      preview={preview}>
      <Box css={{ position: "relative" }}>
        <Container
          size="3"
          css={{
            px: "$3",
            py: "$7",
            width: "100%",
            "@bp3": {
              py: "$8",
              px: "$3",
            },
          }}>
          <Flex
            css={{
              gap: 200,
              flexDirection: "column",
              "@bp2": {
                flexDirection: "row",
              },
            }}>
            <Box css={{ display: "none", "@bp2": { display: "block" } }}>
              <Link href="/customers" passHref legacyBehavior>
                <A variant="contrast">← Back</A>
              </Link>
            </Box>
            <Box>
              <Box
                css={{
                  maxWidth: 600,
                  mx: "auto",
                  borderBottom: "1px solid $neutral4",
                  pb: "$6",
                  mb: "$6",
                  textAlign: "center",
                  "@bp2": {
                    textAlign: "left",
                  },
                }}>
                <Text size="3" variant="neutral" css={{ mb: "$2" }}>
                  Customer Story
                </Text>
                <Heading
                  as="h1"
                  size="3"
                  css={{
                    fontWeight: 500,
                  }}>
                  {title}
                </Heading>
              </Box>
              <Flex
                css={{
                  maxWidth: 600,
                  mx: "auto",
                  mb: 250,
                  gap: 16,
                }}>
                <Box
                  css={{
                    fontSize: 80,
                    fontFamily: "Helvetica",
                    mt: "-12px",
                    color: "$neutral8",
                  }}>
                  “
                </Box>
                <Box
                  className="markdown-body"
                  css={{
                    fontSize: "20px !important",
                    display: "flex",
                  }}>
                  <Box>
                    <ReactMarkdown children={body} />
                    <Flex
                      css={{
                        mt: "$7",
                        ai: "center",
                        gap: "$1",
                      }}>
                      <Text css={{ fontWeight: 500 }} size="3">
                        {endorserName},
                      </Text>
                      <Text size="3">{endorserRole}</Text>
                    </Flex>
                  </Box>
                </Box>
              </Flex>
            </Box>
          </Flex>
        </Container>
      </Box>
    </Layout>
  );
};

Customer.theme = "light-theme-green";
export default Customer;

export async function getStaticPaths() {
  const query = `*[_type=="customer"  && defined(slug.current)][].slug.current`;
  const data = await client.fetch(query);
  const paths = data.map((path: string) => ({ params: { slug: path } }));

  return {
    fallback: true,
    paths,
  };
}

export async function getStaticProps({ params }) {
  const { slug } = params;

  const queryParams = {
    slug,
  };

  const query = `*[_type=="customer"  && slug.current == $slug][0]{
        ...
      }`;
  const pageData = (await client.fetch(query, queryParams)) ?? {};

  return {
    props: {
      ...pageData,
    },
    revalidate: 300,
  };
}
