import Layout from "../Layout";
import Button from "../Button";
import { Container, Heading, Box, Text } from "@theme-ui/components";

const DefaultError = () => {
  return (
    <Layout>
      <img
        src="img/404.png"
        alt=""
        sx={{
          position: "absolute",
          width: "100%",
          left: "50%",
          top: "50%",
          transform: ["translate(-50%,-150%)", "translate(-50%, -50%)"],
          zIndex: "-1",
        }}
      />
      <Container sx={{ py: "250px", my: "auto" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}>
          <Heading
            as="h1"
            sx={{ mb: 4, fontSize: [6, 7, 9], fontWeight: "bold" }}>
            Something went wrong.
          </Heading>
          <Text
            sx={{
              fontSize: [3, 3, 4],
            }}>
            The page you requested could not be found.
          </Text>
          <Button sx={{ my: "30px" }} href="/" isLink>
            Go to the homepage
          </Button>
        </Box>
      </Container>
    </Layout>
  );
};
export default DefaultError;
