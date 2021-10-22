import Layout from "layouts/main";
import Login from "@components/Marketing/Login";
import Link from "next/link";
import {
  Flex,
  Box,
  Container,
  Heading,
  Link as A,
} from "@livepeer.com/design-system";
import { useState } from "react";
import { useApi, useLoggedIn } from "hooks";
import { useRouter } from "next/router";
import Guides from "@components/Marketing/Guides";
import { Register as Content } from "content/content";

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
      <Guides backgroundColor="$mauve2" />
      <Box css={{ position: "relative" }}>
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
            css={{
              alignItems: "center",
              justifyContent: "center",
              flexGrow: 1,
              flexDirection: "column",
              py: "$5",
            }}>
            <Heading size="3" as="h1" css={{ mb: "$5" }}>
              Reset your password
            </Heading>
            <Login
              id="reset-password"
              showEmail={false}
              showPassword={true}
              buttonText="Change password"
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

export default ResetPasswordPage;
