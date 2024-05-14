import Layout from "layouts/auth";
import ForgotPassword from "components/ForgotPassword";
import {
  Button,
  Flex,
  Box,
  Text,
  Container,
  Link as A,
} from "@livepeer/design-system";
import { useState } from "react";
import { useApi, useLoggedIn } from "hooks";
import Link from "next/link";
import { ForgotPassword as Content } from "content";

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

  return (
    <Layout {...Content.metaData}>
      {success ? (
        <Box
          css={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            zIndex: 1,
          }}>
          Password reset link sent to your email.
        </Box>
      ) : (
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
              px: "$3",
              width: "100%",
              "@bp3": {
                px: "$4",
              },
            }}>
            <Flex
              align="center"
              justify="center"
              css={{
                flexGrow: 1,
                flexDirection: "column",
              }}>
              <ForgotPassword
                id="forgot-password"
                buttonText="Email reset link"
                onSubmit={onSubmit}
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
                <Text
                  variant="neutral"
                  css={{
                    display: "flex",
                    gap: 10,
                    with: "100%",
                    justifyContent: "center",
                  }}>
                  Nevermind!
                  <Link href="/login" passHref legacyBehavior>
                    <A>Take me back to sign in</A>
                  </Link>
                </Text>
              </Box>
            </Flex>
          </Container>
        </Box>
      )}
    </Layout>
  );
};

ForgotPasswordPage.theme = "dark-theme-gray";
export default ForgotPasswordPage;
