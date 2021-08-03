import Layout from "layouts/main";
import Hero from "@components/Marketing/Hero";
import Why from "@components/Marketing/Why";
import CaseStudy from "@components/Marketing/CaseStudy";
import Prefooter from "@components/Marketing/Prefooter";
import { GraphQLClient, request } from "graphql-request";
import { print } from "graphql/language/printer";
import allUseCases from "../../queries/allUseCases.gql";
import { useRouter } from "next/router";
import { Box } from "@livepeer.com/design-system";
import client from "../../lib/client";
import imageUrlBuilder from "@sanity/image-url";

const UseCase = ({
  title,
  description,
  openGraphImage,
  hero,
  noindex = false,
  why,
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
      title={`${title}`}
      description={description ? description : hero.description}
      noindex={noindex}
      image={
        openGraphImage
          ? {
              url: builder.image(openGraphImage).url(),
              alt: openGraphImage?.asset?.altText,
            }
          : null
      }
      url={`https://livepeer.com${asPath}`}
      preview={preview}>
      <Hero
        tagline="Use cases"
        heading={hero.heading}
        description={hero.description}
        image={hero.image.asset.url}
      />
      <Why
        backgroundColor="$panel"
        title="Why Livepeer.com"
        heading={why.heading}
        reasons={why.reasons}
      />
      {caseStudy.heading && (
        <CaseStudy
          heading={caseStudy.heading}
          about={caseStudy.about}
          problem={caseStudy.problem}
          solution={caseStudy.solution}
          image={caseStudy.image?.asset.url}
          testimonial={caseStudy?.testimonial}
          internalLink={caseStudy.internalLink}
        />
      )}
      <Prefooter />
    </Layout>
  );
};

export async function getStaticPaths() {
  const { allUseCase } = await request(
    "https://dp4k3mpw.api.sanity.io/v1/graphql/production/default",
    print(allUseCases),
    {
      where: {},
    }
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

export default UseCase;
