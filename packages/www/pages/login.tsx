import Layout from "layouts/main";
import Login from "@components/Marketing/Login";
import Button from "@components/Marketing/Button";
import {
  Flex,
  Box,
  Heading,
  Container,
  Link as A,
} from "@livepeer/design-system";
import { useState } from "react";
import { useApi, useLoggedIn } from "../hooks";
import Link from "next/link";
import { Login as Content } from "content";

const LoginPage = () => {
  useLoggedIn(false);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const { login } = useApi();

  const onSubmit = async ({ email, password }) => {
    setLoading(true);
    setErrors([]);
    const res = await login(email, password);
    // Don't need to worry about the success case, we'll redirect
    if (res.errors) {
      setErrors(res.errors);
      setLoading(false);
    }
  };
  return (
    <Layout {...Content.metaData}>
      <Box css={{ position: "relative" }}>
        <Container
          size="3"
          css={{
            px: "$6",
            py: "$7",
            width: "100%",
            "@bp3": {
              pt: 100,
              pb: 140,
              px: "$4",
            },
          }}>
          <Flex
            css={{
              alignItems: "center",
              justifyContent: "center",
              flexGrow: 1,
              flexDirection: "column",
            }}>
            <Heading size="4" as="h1" css={{ mb: "$6" }}>
              Sign in
            </Heading>
            <Login
              id="login"
              onSubmit={onSubmit}
              showEmail={true}
              showPassword={true}
              buttonText="Continue"
              errors={errors}
              loading={loading}
            />
            <Box css={{ maxWidth: 500, width: "100%" }}>
              <Box css={{ textAlign: "center" }}>
                <Link href="/forgot-password" passHref>
                  <A css={{ textDecoration: "none" }}>Forgot your password?</A>
                </Link>
              </Box>
              <Box
                css={{
                  width: "100%",
                  height: "1px",
                  mt: "$5",
                  mb: "$3",
                  bc: "$neutral6",
                }}
              />
              <Link href="/register" passHref>
                <Button
                  href="/register"
                  as={A}
                  css={{
                    width: "100%",
                    fontSize: "$3",
                    mt: "$2",
                    px: "$3",
                    backgroundColor: "$transparent",
                    color: "$hiContrast",
                    borderColor: "$hiContrast",
                    textDecoration: "none",
                    transition: ".15s",
                    "&:hover": {
                      transition: ".15s",
                      bc: "$hiContrast",
                      color: "$loContrast",
                      textDecoration: "none",
                    },
                  }}>
                  Create new account
                </Button>
              </Link>
            </Box>
          </Flex>
        </Container>
      </Box>
    </Layout>
  );
};

LoginPage.theme = "dark-theme-blue";
export default LoginPage;
