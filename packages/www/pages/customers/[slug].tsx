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
import BlockContent from "@sanity/block-content-to-react";
import SplitImage from "components/Site/SplitImage";

const serializers = {
  types: {
    metricsSection: ({ node: { metrics } }) => {
      return (
        <Box
          css={{
            mb: "$8",
            display: "grid",
            gridTemplateColumns: "repeat(1, auto)",
            gap: 40,
            "@bp1": {
              gridTemplateColumns: "repeat(2, auto)",
            },
            "@bp2": {
              gridTemplateColumns: "repeat(4, auto)",
            },
          }}>
          {metrics.map((metric, i) => (
            <Box
              css={{
                alignItems: "center",
                justifyContent: "center",
                display: "flex",
                flexDirection: "column",
                bc: `$green${3 + i}`,
                height: 200,
                width: 200,
                p: 20,
                borderRadius: 1000,
                textAlign: "center",
              }}>
              <Box css={{ fontWeight: 700, fontSize: 40 }}>{metric.title}</Box>
              <Text size={3} css={{ minHeight: 50 }}>
                {metric.description}
              </Text>
            </Box>
          ))}
        </Box>
      );
    },
    splitImage: ({ node: { defaultImage, portableText, inverted, title } }) => {
      return (
        <SplitImage
          title={title ? title : ""}
          defaultImage={defaultImage}
          inverted={inverted}
          portableText={portableText}
        />
      );
    },
  },
};

const Customer = ({
  title,
  noindex = false,
  preview,
  body,
  headline,
  excerpt,
  endorserName,
  endorserRole,
  companyLogo,
  content,
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
            maxWidth: 960,
            mx: "0 auto",
            "@bp3": {
              py: "$8",
              px: "$3",
            },
          }}>
          <Flex
            css={{
              gap: 40,
              flexDirection: "column",
            }}>
            <Box css={{ display: "none", "@bp2": { display: "block" } }}>
              <Link href="/customers" passHref legacyBehavior>
                <A variant="contrast">← Back</A>
              </Link>
            </Box>
            <Box>
              <Box
                css={{
                  pb: "$6",
                }}>
                <Text size="3" variant="neutral" css={{ mb: "$2" }}>
                  Customer Story
                </Text>

                <Heading
                  as="h2"
                  size="4"
                  css={{
                    mb: 0,
                    fontWeight: 500,
                    "@bp2": {
                      letterSpacing: "-3px",
                    },
                  }}>
                  {headline ? headline : title}
                </Heading>
              </Box>

              <Box
                as={A}
                css={{
                  transform: "scale(1)",
                  transition: ".1s",
                  bc: "$neutral12",
                  py: 20,
                  minHeight: 250,
                  px: "$6",
                  color: "white",
                  width: "100%",
                  borderRadius: 20,
                  border: "1px solid $neutral4",
                  textAlign: "center",
                  textDecoration: "none",
                  display: "flex",
                  ai: "center",
                  justifyContent: "center",
                  position: "relative",
                  fontWeight: 600,
                  fontSize: "$7",
                  mb: "$3",
                  "@bp1": {
                    pl: "$3",
                    "&:nth-child(odd)": {
                      pl: "$6",
                    },
                  },
                  "@bp3": {
                    "&:nth-child(odd)": {
                      pl: "$3",
                    },
                  },
                }}>
                {companyLogo ? (
                  <img
                    width={250}
                    height={250}
                    style={{
                      objectFit: "contain",
                      filter: "invert(1)",
                    }}
                    src={companyLogo.asset.url}
                    alt={title}
                  />
                ) : (
                  title
                )}
              </Box>
              {excerpt && (
                <Text
                  size={2}
                  variant="neutral"
                  css={{ mb: "$4", lineHeight: 1.8 }}>
                  {excerpt}
                </Text>
              )}
              <Box
                css={{
                  ".markdown-body img": {
                    borderRadius: 8,
                    maxWidth: 500,
                    width: "100%",
                    mb: "$4",
                  },
                }}>
                <Box className="markdown-body">
                  <BlockContent
                    blocks={content}
                    serializers={serializers}
                    {...client.config()}
                  />
                </Box>
              </Box>
              {body && (
                <Box css={{ mt: "$5" }}>
                  <Box className="markdown-body">
                    <Heading as="h3">Testimonial</Heading>
                  </Box>
                  <Flex
                    css={{
                      mx: "auto",
                      gap: 16,
                      mt: "$4",
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
                          {endorserName && endorserRole && (
                            <>
                              <Text css={{ fontWeight: 500 }} size="3">
                                {endorserName},
                              </Text>
                              <Text size="3">{endorserRole}</Text>
                            </>
                          )}
                        </Flex>
                      </Box>
                    </Box>
                  </Flex>
                </Box>
              )}
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
  const query = `*[_type=="customer" && defined(slug.current) && _id in path("drafts.**")][].slug.current`;
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
        ...,
        headline->{...},
        excerpt->{...},
        companyLogo{
          asset->{...}
        }
      }`;
  const pageData = (await client.fetch(query, queryParams)) ?? {};

  return {
    props: {
      ...pageData,
    },
    revalidate: 1,
  };
}
