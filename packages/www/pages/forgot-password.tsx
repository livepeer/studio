/** @jsx jsx */
import { jsx } from "theme-ui";
import Layout from "../layouts";
import Login from "../components/Login";
import Link from "../components/Link";
import { Flex, Box } from "@theme-ui/components";
import { useState } from "react";
import { useApi, useLoggedIn } from "../hooks";

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
    <Layout>
      <Flex
        sx={{
          alignItems: "center",
          justifyContent: "center",
          flexGrow: 1,
          flexDirection: "column",
          py: 6,
        }}>
        <Box as="h3" sx={{ mb: 4 }}>
          Reset your password
        </Box>
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
          <Link href="/login">Take me back to log in</Link>
        </Box>
      </Flex>
    </Layout>
  );
};

export default ForgotPasswordPage;
