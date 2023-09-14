import Layout from "layouts/main";
import ResetPassword from "components/ResetPassword";
import Link from "next/link";
import {
  Button,
  Flex,
  Box,
  Container,
  Text,
  Link as A,
} from "@livepeer/design-system";
import { useState } from "react";
import { useApi, useLoggedIn } from "hooks";
import { useRouter } from "next/router";
import { ResetPassword as Content } from "content";

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
              buttonText="Reset password"
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
              <Link href="/" passHref legacyBehavior>
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
                    Nevermind! Take me back to sign in
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

ResetPasswordPage.theme = "light-theme-green";
export default ResetPasswordPage;
