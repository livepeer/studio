'use client';

import Layout from "layouts/auth";
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
import { useRouter } from "next/navigation";
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
            css={{
              alignItems: "center",
              justifyContent: "center",
              flexGrow: 1,
              flexDirection: "column",
              py: "$5",
            }}>
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
    </Layout>
  );
};

ResetPasswordPage.theme = "dark-theme-gray";
export default ResetPasswordPage;
