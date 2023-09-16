import Layout from "layouts/main";
import Hero from "components/Site/Hero";
import Why from "components/Site/Why";
import CaseStudy from "components/Site/CaseStudy";
import Prefooter from "components/Site/Prefooter";
import { GraphQLClient, request } from "graphql-request";
import { print } from "graphql/language/printer";
import allUseCases from "../../queries/allUseCases.gql";
import { useRouter } from "next/router";
import { Box, Flex, Button, Link as A } from "@livepeer/design-system";
import { client } from "../../lib/client";
import imageUrlBuilder from "@sanity/image-url";
import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";

const ctas = (
  <Flex
    align="center"
    css={{ gap: "$4", ml: "$8", display: "none", "@bp2": { display: "flex" } }}>
    <Link
      href="https://livepeer.studio/register"
      passHref
      legacyBehavior
      css={{
        mb: "$8",
        textDecoration: "none",
        "&:hover": {
          textDecoration: "none",
        },
      }}>
      <Button as={A} variant="green" size="4" css={{ gap: "$2" }}>
        Start building
        <FiArrowUpRight />
      </Button>
    </Link>
    <Link
      href="https://docs.livepeer.org"
      target="_blank"
      css={{
        mb: "$8",
        textDecoration: "none",
        "&:hover": {
          textDecoration: "none",
        },
      }}>
      <Button ghost size="4" css={{ gap: "$2" }}>
        Read the docs
        <FiArrowUpRight />
      </Button>
    </Link>
  </Flex>
);

const UseCase = ({
  metaTitle,
  metaDescription,
  metaUrl,
  openGraphImage,
  hero,
  noindex = false,
  why,
  features,
  caseStudy,
  preview,
}) => {
  const { isFallback, asPath } = useRouter();
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
        tagline="Use cases"
        heading={hero.heading}
        description={hero.description}
        image={hero.image}
        imageType="rectangle"
        ctas={[
          {
            href: "/register",
            children: "Get started",
          },
          {
            href: "/contact",
            children: "Talk to an expert",
          },
        ]}
      />
      <Why
        backgroundColor="$panel"
        title="Why Livepeer Studio"
        heading={why.heading}
        reasons={why.reasons}
        ctas={ctas}
      />
      <Why
        title="Features"
        heading={features.heading}
        reasons={features.reasons}
        ctas={ctas}
      />
      {caseStudy.heading && (
        <CaseStudy
          backgroundColor="$panel"
          heading={caseStudy.heading}
          about={caseStudy.about}
          problem={caseStudy.problem}
          solution={caseStudy.solution}
          testimonial={caseStudy?.testimonial}
          internalLink={caseStudy.internalLink}
        />
      )}
      <Prefooter />
    </Layout>
  );
};

export async function getStaticPaths() {
  const { allUseCase }: any = await request(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default",
    allUseCases
  );
  let paths = [];
  for (const useCase of allUseCase) {
    paths.push({ params: { slug: useCase.slug.current } });
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

  let data: any = await graphQLClient.request(print(allUseCases), {
    where: {
      slug: { current: { eq: slug } },
    },
  });

  let useCase = data.allUseCase.find((p) => p.slug.current === slug);
  return {
    props: {
      ...useCase,
    },
    revalidate: 1,
  };
}

UseCase.theme = "light-theme-green";
export default UseCase;
