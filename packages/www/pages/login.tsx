import Layout from "../components/Layout";
import Login from "../components/Login";
import Link from "../components/Link";
import { Flex, Box, Heading } from "@theme-ui/components";
import { useState } from "react";
import { useApi, useLoggedIn } from "../hooks";

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
    <Layout>
      <Flex
        sx={{
          alignItems: "center",
          justifyContent: "center",
          flexGrow: 1,
          flexDirection: "column",
          mx: [3, 0],
          py: 6,
        }}>
        <h3 sx={{ mb: 4 }}>Log in</h3>
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
          <Link href="/forgot-password">Forgot your password?</Link>
        </Box>
      </Flex>
    </Layout>
  );
};

export default LoginPage;
