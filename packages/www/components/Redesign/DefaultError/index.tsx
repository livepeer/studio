import Layout from "layouts/redesign";
import Button from "components/Redesign/Button";
import { Container, Heading, Box, Text } from "@livepeer.com/design-system";
import Link from "next/link";

const DefaultError = () => {
  return (
    <Layout>
      <Box
        as="img"
        src="img/404.png"
        alt=""
        css={{
          position: "absolute",
          width: "100%",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-150%)",
          zIndex: -1,
          "@bp2": {
            transform: "translate(-50%, -50%)",
          },
        }}
      />
      <Container css={{ py: "250px", my: "auto" }}>
        <Box
          css={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}>
          <Heading as="h1" size="4" css={{ fontWeight: 700 }}>
            Something went wrong.
          </Heading>
          <Text size="5">The page you requested could not be found.</Text>
          <Link href="/" passHref>
            <Button arrow css={{ my: "30px" }}>
              Go to the homepage
            </Button>
          </Link>
        </Box>
      </Container>
    </Layout>
  );
};
export default DefaultError;
