import { Box, Container, Text, Link as A } from "@livepeer/design-system";
import { useRouter } from "next/router";
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
  console.log(customers);
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

  return (
    <Layout {...seoData}>
      <Box css={{ position: "relative" }}>
        <Container
          size="4"
          css={{
            maxWidth: "1245px",
            px: "$6",
            py: "$7",
            width: "100%",
            "@bp3": {
              pt: "$6",
              pb: "$8",
              px: "$4",
            },
          }}>
          <Box css={{ textAlign: "center", maxWidth: 890, m: "0 auto" }}>
            <Box
              as="h1"
              css={{
                fontSize: 56,
                lineHeight: "60px",
                fontWeight: 700,
                letterSpacing: "-2px",
                mb: "$3",
                textTransform: "uppercase",
              }}>
              Customer Stories
            </Box>
            <Text
              size={5}
              variant="neutral"
              css={{ lineHeight: 1.7, mb: "$5" }}>
              Livepeer Studio empowers visionary product teams shaping the
              future of video, supporting next-generation startups and
              established industry leaders.
            </Text>
          </Box>
        </Container>
        <Box
          css={{
            mb: 200,
            position: "relative",
            bc: "$neutral2",
            py: "$6",
            borderTop: "1px solid $neutral4",
          }}>
          <Box
            css={{
              display: "grid",
              grid: "1fr/repeat(1,1fr)",
              position: "relative",
              height: "100%",
              maxWidth: "1145px",
              gap: 20,
              margin: "0 auto",
              "@bp1": {
                grid: "1fr/repeat(2,1fr)",
              },
              "@bp3": {
                grid: "1fr/repeat(3,1fr)",
              },
            }}>
            {customers.map((customer, i) => {
              return (
                <Link
                  key={i}
                  href={`/customers/${customer.slug.current}`}
                  passHref
                  legacyBehavior>
                  <Box
                    as={A}
                    css={{
                      transform: "scale(1)",
                      transition: ".1s",
                      bc: "$neutral12",
                      py: 100,
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
                      "&:hover": {
                        textDecoration: "none",
                        transform: "scale(1.02)",
                        transition: ".1s",
                      },
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
                    {customer?.companyLogo ? (
                      <img
                        width={180}
                        height={180}
                        style={{ objectFit: "contain", filter: "invert(1)" }}
                        src={customer?.companyLogo.asset.url}
                        alt={customer.title}
                      />
                    ) : (
                      customer.title
                    )}
                  </Box>
                </Link>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export async function getStaticProps() {
  const customersQuery = `*[_type=="customer" && !(_id in path('drafts.**'))]{
    ...,
    title->{...},
    companyLogo{
      asset->{...}
    }
  }`;
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
