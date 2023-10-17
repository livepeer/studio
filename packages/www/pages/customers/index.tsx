import { Box, Container, Grid } from "@livepeer/design-system";
import { useRouter } from "next/router";
import BlogPostCard, {
  FeaturedBlogPostCard,
} from "components/Site/BlogPostCard";
import Layout from "layouts/main";
import Link from "next/link";
import { Customers as CustomersContent } from "content";
import { client } from "lib/client";

const CustomersPage = ({ customers }) => {
  const router = useRouter();
  const {
    query: { slug },
    asPath,
  } = router;

  if (router.isFallback) {
    return (
      <Layout>
        <Box>Loading....</Box>
      </Layout>
    );
  }

  const seoData =
    asPath === "/customers"
      ? CustomersContent.metaData
      : customers
          .filter((customer) => customer.slug.current === slug)
          .map((customer) => ({
            title: customer.metaTitle,
            description: customer.metaDescription,
            url: customer.metaUrl,
          }))?.[0];

  console.log(customers);
  return (
    <Layout {...seoData}>
      <Box css={{ position: "relative" }}>
        <Container
          size="4"
          css={{
            px: "$3",
            py: "$2",
            width: "100%",
            "@bp2": {
              px: "$4",
            },
          }}>
          <Box
            css={{
              textAlign: "left",
              mt: 60,
              mb: 60,
              "@bp2": {
                mt: 110,
                mb: 120,
              },
            }}>
            <Box
              as="h1"
              css={{
                textTransform: "uppercase",
                fontSize: 70,
                fontWeight: 500,
                lineHeight: "82px",
                mx: 0,
                mt: 0,
                letterSpacing: "-4px",
                "@bp2": { fontSize: 130 },
              }}>
              Customers
            </Box>
          </Box>

          <Grid
            gap={4}
            css={{
              mb: 100,
              gridTemplateColumns: "repeat(1,1fr)",
              "@bp2": {
                gridTemplateColumns: "repeat(2,1fr)",
              },
              "@bp3": {
                gridTemplateColumns: "repeat(3,1fr)",
              },
            }}>
            {customers.map((p, i) => (
              <Box key={`post-${i}`}>{i}</Box>
            ))}
          </Grid>
        </Container>
      </Box>
    </Layout>
  );
};

export async function getStaticProps() {
  // const client = getClient();

  const customersQuery = `*[_type=="customer" ]{
    ...,
    title->{...},
    companyLogo{
      asset->{...}
  }}`;
  const customers = await client.fetch(customersQuery);
  return {
    props: {
      customers,
    },
    revalidate: 1,
  };
}

CustomersPage.theme = "light-theme-green";
export default CustomersPage;
