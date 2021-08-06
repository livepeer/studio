import Layout from "layouts/main";
import Button from "components/Marketing/Button";
import { Container, Heading, Box, Text } from "@livepeer.com/design-system";
import Link from "next/link";
import Image from "next/image";
import Guides from "components/Marketing/Guides";

const DefaultError = () => {
  return (
    <Layout>
      <Box css={{ position: "relative" }}>
        <Guides />
        <Image
          src="/img/404.png"
          alt="404"
          layout="fill"
          objectFit="contain"
          css={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        <Container
          size="3"
          css={{ position: "relative", px: "$4", py: "250px", my: "auto" }}>
          <Box
            css={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              position: "relative",
            }}>
            <Heading as="h1" size="4" css={{ fontWeight: 700, mb: "$4" }}>
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
      </Box>
    </Layout>
  );
};
export default DefaultError;
