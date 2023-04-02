import Layout from "layouts/main";
import ForgotPassword from "components/Dashboard/ForgotPassword";
import { Flex, Box, Text, Container, Link as A } from "@livepeer/design-system";
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
            height: "100vh",
            display: "flex",
            alignItems: "center",
          }}>
          <Container
            size="3"
            css={{
              px: "$6",
              py: "$7",
              width: "100%",
              "@bp3": {
                py: "$8",
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
              <Text
                size="8"
                as="h1"
                css={{
                  textTransform: "uppercase",
                  mb: "$6",
                  fontWeight: 700,
                  width: 150,
                  lineHeight: "30px",
                  textAlign: "center",
                }}>
                Livepeer Studio
              </Text>
              <ForgotPassword
                id="forgot-password"
                buttonText="Get reset link"
                onSubmit={onSubmit}
                errors={errors}
                loading={loading}
              />
              <Box>
                Nevermind!&nbsp;
                <Link href="/" passHref legacyBehavior>
                  <A>Take me back to log in</A>
                </Link>
              </Box>
            </Flex>
          </Container>
        </Box>
      )}
    </Layout>
  );
};

ForgotPasswordPage.theme = "dark-theme-green";
export default ForgotPasswordPage;
