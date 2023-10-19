import { Box, Container, Text } from "@livepeer/design-system";
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
                fontSize: 70,
                lineHeight: "60px",
                fontWeight: 600,
                letterSpacing: "-1px",
                mb: "$6",
              }}>
              Customers
            </Box>
            <Text size={5} css={{ lineHeight: 1.7, mb: "$5" }}>
              Livepeer Studio empowers visionary product teams shaping the
              future of video, supporting next-generation startups and
              established industry leaders.
            </Text>
          </Box>
        </Container>
        <Box css={{ mb: 200, position: "relative", bc: "$neutral2", py: "$6" }}>
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
                <Box
                  key={i}
                  css={{
                    bc: "white",
                    py: "$4",
                    pl: "$6",
                    pr: "$6",
                    width: "100%",
                    borderRadius: "$4",
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
                  {/* {item?.icon?.provider && (
                  <Box
                    css={{
                      mb: "$3",
                      width: 44,
                      height: 44,
                      minWidth: 44,
                      minHeight: 44,
                      borderRadius: 1000,
                      display: "flex",
                      ai: "center",
                      color: "$hiContrast",
                      jc: "center",
                      background:
                        "linear-gradient(90deg, $green4 0%, $green5 100%)",
                    }}>
                    {getIconProvider(item.icon.provider)[item.icon.name]()}
                  </Box>
                )} */}
                  <Text
                    css={{
                      position: "relative",
                      fontWeight: 600,
                      mb: "$2",
                      fontSize: "$5",
                    }}>
                    {customer.title}
                  </Text>
                </Box>
              );
            })}
          </Box>
        </Box>
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
