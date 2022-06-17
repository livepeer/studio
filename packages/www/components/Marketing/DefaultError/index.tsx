import Layout from "layouts/main";
import Button from "components/Marketing/Button";
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
          css={{
            position: "relative",
            px: "$4",
            pt: 250,
            pb: 250,
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
            }}>
            <Heading
              as="h1"
              css={{
                fontWeight: 700,
                mb: "$8",
                lineHeight: "80px",
                fontSize: 80,
              }}>
              Something went wrong.
            </Heading>
            <Text size="5">The page you requested could not be found.</Text>
            <Link href="/" passHref>
              <A css={{ mt: "$4" }}>Go to the homepage</A>
            </Link>
          </Box>
        </Container>
      </Box>
    </Layout>
  );
};
export default DefaultError;
