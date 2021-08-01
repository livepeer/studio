import Layout from "layouts/redesign";
import Login from "components/Redesign/Login";
import {
  Flex,
  Box,
  Heading,
  Container,
  Link as A,
} from "@livepeer.com/design-system";
import { useState } from "react";
import { useApi, useLoggedIn } from "../hooks";
import Link from "next/link";
import Guides from "components/Redesign/Guides";

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
    <Layout
      title={`Login - Livepeer.com`}
      description={`The world’s most affordable, powerful and easy-to-use video streaming API, powered by Livepeer.`}
      url={`https://livepeer.com/register`}
      theme="dark">
      <Guides backgroundColor="$mauve2" />
      <Box css={{ position: "relative" }}>
        <Container
          size="3"
          css={{
            px: "$6",
            pt: "$6",
            pb: "$7",
            width: "100%",
            "@bp3": {
              pt: "$8",
              pb: "$9",
              px: "$3",
            },
          }}>
          <Flex
            css={{
              alignItems: "center",
              justifyContent: "center",
              flexGrow: 1,
              flexDirection: "column",
            }}>
            <Heading size="3" as="h1" css={{ mb: "$5" }}>
              Log in
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
            <Box>
              <Link href="/forgot-password" passHref>
                <A>Forgot your password?</A>
              </Link>
            </Box>
          </Flex>
        </Container>
      </Box>
    </Layout>
  );
};

export default LoginPage;
