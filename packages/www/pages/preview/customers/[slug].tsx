import { client } from "lib/client";
import dynamic from "next/dynamic";

export const getServerSideProps = async ({ params }) => {
  const { slug } = params;

  const queryParams = {
    slug,
  };

  const query = `*[_type=="customer"  && slug.current == $slug][0]{
        ...,
        companyLogo{
          asset->{...}
        }
      }`;

  const pageData = (await client.fetch(query, queryParams)) ?? {};

  return {
    props: {
      ...pageData,
      noindex: true,
      preview: true,
    },
  };
};

function withStaticProps(Component, staticProps) {
  return Object.assign(Component, staticProps);
}

// force light theme
const DynamicComponentWithTheme = withStaticProps(
  dynamic(() => import("../../customers/[slug]")),
  { theme: "light-theme-green" }
);

export default DynamicComponentWithTheme;
