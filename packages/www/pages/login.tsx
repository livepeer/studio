import Layout from "layouts/main";
import Login from "components/Login";
import {
  Flex,
  Box,
  Button,
  Container,
  Text,
  Link as A,
} from "@livepeer/design-system";
import { useState } from "react";
import { useApi } from "../hooks";
import Link from "next/link";
import { Home as Content } from "content";

const LoginPage = () => {
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
          height: "100vh",
          display: "flex",
          alignItems: "center",
        }}>
        <Container
          size="3"
          css={{
            px: "$3",
            py: "$6",
            width: "100%",
            "@bp3": {
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
            <Text
              size="8"
              as="h1"
              css={{
                mb: "$7",
                fontWeight: 500,
                lineHeight: "30px",
                textAlign: "center",
              }}>
              Signin in to your account
            </Text>

            <Login
              id="login"
              onSubmit={onSubmit}
              buttonText="Sign in"
              errors={errors}
              loading={loading}
            />
            <Box css={{ maxWidth: 500, width: "100%" }}>
              <Box
                css={{
                  width: "100%",
                  height: "1px",
                  mb: "$3",
                  background:
                    "linear-gradient(to right,transparent,rgba(255,255,255,0.1) 50%,transparent)",
                }}
              />
              <Link href="/register" passHref legacyBehavior>
                <A
                  css={{
                    "&:hover": {
                      textDecoration: "none",
                    },
                  }}>
                  <Button
                    size="4"
                    css={{
                      width: "100%",
                      fontSize: "$3",
                      "&:hover": {
                        textDecoration: "none",
                      },
                    }}>
                    Create new account
                  </Button>
                </A>
              </Link>
            </Box>
          </Flex>
        </Container>
      </Box>
    </Layout>
  );
};

LoginPage.theme = "light-theme-green";
export default LoginPage;
