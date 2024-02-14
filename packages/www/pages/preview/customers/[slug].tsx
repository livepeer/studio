import { client } from "lib/client";
import Customer from "../../customers/[slug]";

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

Customer.theme = "light-theme-green";
export default Customer;
