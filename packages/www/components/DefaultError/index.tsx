import Layout from "layouts/main";
import {
  Container,
  Heading,
  Box,
  Text,
  Link as A,
} from "@livepeer/design-system";
import Link from "next/link";
import Image from "next/image";

const DefaultError = () => {
  return (
    <Layout>
      <Box css={{ position: "relative" }}>
        <Container
          size="3"
          css={{
            position: "relative",
            px: "$4",
            my: "auto",
          }}>
          <Box
            css={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              position: "relative",
              height: "100vh",
            }}>
            <Image
              src="/img/404.png"
              alt="404"
              layout="fill"
              objectFit="contain"
            />
            <Heading
              as="h1"
              css={{
                fontWeight: 700,
                mb: "$8",
                lineHeight: "60px",
                fontSize: "$9",
              }}>
              Something went wrong.
            </Heading>
            <Text size="5">The page you requested could not be found.</Text>
            <Link href="/" passHref legacyBehavior>
              <A css={{ zIndex: 100, position: "relative", mt: "$4" }}>
                Go to the homepage
              </A>
            </Link>
          </Box>
        </Container>
      </Box>
    </Layout>
  );
};
export default DefaultError;
