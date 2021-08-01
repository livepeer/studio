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
import { useApi, useLoggedIn } from "hooks";
import Link from "next/link";
import Guides from "components/Redesign/Guides";

const ForgotPasswordPage = () => {
  useLoggedIn(false);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { makePasswordResetToken } = useApi();
  const onSubmit = async ({ email }) => {
    setLoading(true);
    setErrors([]);
    const res = await makePasswordResetToken(email);
    if (res.errors) {
      setLoading(false);
      setErrors(res.errors);
    } else {
      setSuccess(true);
    }
  };
  if (success) {
    return (
      <Layout>
        <Flex
          sx={{
            alignItems: "center",
            justifyContent: "center",
            flexGrow: 1,
            flexDirection: "column",
          }}>
          Password reset link sent to your email.
        </Flex>
      </Layout>
    );
  }
  return (
    <Layout
      title={`Forgot Password - Livepeer.com`}
      description={`The world’s most affordable, powerful and easy-to-use video streaming API, powered by Livepeer.`}
      url={`https://livepeer.com/forgot-password`}
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
            align="center"
            justify="center"
            css={{
              flexGrow: 1,
              flexDirection: "column",
              py: "$6",
            }}>
            <Heading size="3" as="h1" css={{ mb: "$5" }}>
              Reset your password
            </Heading>
            <Login
              id="forgot-password"
              showEmail={true}
              showPassword={false}
              buttonText="Get reset link"
              onSubmit={onSubmit}
              errors={errors}
              loading={loading}
            />
            <Box>
              Nevermind!&nbsp;
              <Link href="/login" passHref>
                <A>Take me back to log in</A>
              </Link>
            </Box>
          </Flex>
        </Container>
      </Box>
    </Layout>
  );
};

export default ForgotPasswordPage;
