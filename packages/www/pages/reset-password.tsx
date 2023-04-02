import Layout from "layouts/main";
import ResetPassword from "components/Dashboard/ResetPassword";
import Link from "next/link";
import { Flex, Box, Container, Text, Link as A } from "@livepeer/design-system";
import { useState } from "react";
import { useApi, useLoggedIn } from "hooks";
import { useRouter } from "next/router";
import { Register as Content } from "content";

const ResetPasswordPage = () => {
  useLoggedIn(false);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useApi();
  const router = useRouter();
  const { email, resetToken } = router.query;

  const onSubmit = async ({ password }) => {
    setLoading(true);
    setErrors([]);
    const res = await resetPassword(email, resetToken, password);
    // Don't need to worry about the success case, we'll redirect
    if (res.errors) {
      setLoading(false);
      setErrors(res.errors);
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
            py: "$7",
            width: "100%",
            "@bp3": {
              py: "$8",
              px: "$4",
            },
          }}>
          <Flex
            css={{
              alignItems: "center",
              justifyContent: "center",
              flexGrow: 1,
              flexDirection: "column",
              py: "$5",
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
            <ResetPassword
              id="reset-password"
              onSubmit={onSubmit}
              buttonText="Sign in"
              errors={errors}
              loading={loading}
            />
            <Box>
              <Link href="/" passHref legacyBehavior>
                <A>Nevermind! Take me back to sign in</A>
              </Link>
            </Box>
          </Flex>
        </Container>
      </Box>
    </Layout>
  );
};

ResetPasswordPage.theme = "dark-theme-green";
export default ResetPasswordPage;
