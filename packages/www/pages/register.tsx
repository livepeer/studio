import Layout from "../components/Layout";
import Login from "../components/Login";
import Link from "../components/Link";
import { Flex, Box, Heading } from "@theme-ui/components";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import useApi from "../hooks/use-api";

const RegisterPage = () => {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { register, user } = useApi();

  useEffect(() => {
    if (user) {
      router.replace("/app/user");
    }
  }, [user]);

  const onSubmit = async ({ email, password }) => {
    const selectedPlan = router.query?.selectedPlan;
    setLoading(true);
    setErrors([]);
    const res = await register(
      email,
      password,
      selectedPlan ? +selectedPlan : 0
    );
    // Don't need to worry about the success case, we'll redirect
    if (res.errors) {
      setErrors(res.errors);
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
          py: 6
        }}
      >
        <h3 sx={{ mb: 4 }}>Create an Account</h3>
        <Box
          sx={{
            mb: 4,
            textAlign: "center",
            maxWidth: 630,
            mx: "auto"
          }}
        >
          Sign up to try Livepeer.com's video-centric UGC platform, and qualify
          for 1,000 free transcoding input minutes per month.
        </Box>
        <Login
          id="register"
          onSubmit={onSubmit}
          showEmail={true}
          showPassword={true}
          buttonText="Continue"
          loading={loading}
          errors={errors}
        />
        <Box>
          Already have an account?&nbsp;
          <Link href="/login">Log in</Link>
        </Box>
      </Flex>
    </Layout>
  );
};

export default RegisterPage;
