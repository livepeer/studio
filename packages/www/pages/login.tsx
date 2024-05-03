import Layout from "layouts/auth";
import Login from "components/Login";
import { Flex, Box, Text, Container, Link as A } from "@livepeer/design-system";
import { useState } from "react";
import { useApi, useLoggedIn } from "../hooks";
import Link from "next/link";
import { Home as Content } from "content";

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
      <Box
        css={{
          position: "relative",
          height: "calc(100vh - 70px)",
          display: "flex",
          alignItems: "center",
        }}>
        <Container
          size="3"
          css={{
            width: "100%",
          }}>
          <Flex
            css={{
              flexGrow: 1,
              flexDirection: "column",
            }}>
            <Text
              size="8"
              as="h1"
              css={{
                textAlign: "center",
                mb: "$7",
                fontWeight: 500,
                lineHeight: "30px",
              }}>
              Sign in to your account
            </Text>

            <Login
              id="login"
              onSubmit={onSubmit}
              buttonText="Sign in"
              errors={errors}
              loading={loading}
            />
            <Box
              css={{
                maxWidth: 500,
                mx: "auto",
                width: "100%",
                textAlign: "center",
              }}>
              <Box
                css={{
                  width: "100%",
                  height: "1px",
                  mb: "$3",
                  background:
                    "linear-gradient(to right,transparent,rgba(255,255,255,0.1) 50%,transparent)",
                }}
              />
              <Text
                variant="neutral"
                css={{
                  display: "flex",
                  gap: 10,
                  width: "100%",
                  justifyContent: "center",
                }}>
                <Box>Don't have an account?</Box>
                <Link href="/register" passHref legacyBehavior>
                  <A>Sign up now</A>
                </Link>
              </Text>
            </Box>
          </Flex>
        </Container>
      </Box>
    </Layout>
  );
};

LoginPage.theme = "dark-theme-gray";
export default LoginPage;
