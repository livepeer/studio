import Customer from "../../customers/[slug]";
import { client } from "lib/client";

const PreviewCustomer = Customer;

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

export default PreviewCustomer;
