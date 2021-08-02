import Layout from "layouts/redesign";
import Login from "../components/Redesign/Login";
import {
  Flex,
  Box,
  Heading,
  Text,
  Container,
  Link as A,
} from "@livepeer.com/design-system";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import useApi from "../hooks/use-api";
import Link from "next/link";
import Guides from "@components/Redesign/Guides";

const RegisterPage = () => {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { register, user } = useApi();

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user]);

  const onSubmit = async ({
    email,
    password,
    firstName,
    lastName,
    organization,
    phone,
  }) => {
    const selectedPlan = router.query?.selectedPlan;
    setLoading(true);
    setErrors([]);
    const res = await register({
      email,
      password,
      selectedPlan: selectedPlan ? +selectedPlan : 0,
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(organization && { organization }),
      ...(phone && { phone }),
    });
    // Don't need to worry about the success case, we'll redirect
    if (res.errors) {
      setErrors(res.errors);
    }
  };
  return (
    <Layout
      title={`Register - Livepeer.com`}
      description={`The world’s most affordable, powerful and easy-to-use video streaming API, powered by Livepeer.`}
      url={`https://livepeer.com/register`}>
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
            <Heading size="3" as="h1" css={{ mb: "$3" }}>
              Create an Account
            </Heading>
            <Text
              size="4"
              variant="gray"
              css={{
                mb: "$6",
                textAlign: "center",
                maxWidth: 630,
                mx: "auto",
              }}>
              Sign up to try Livepeer.com's video streaming API.
            </Text>
            <Login
              id="register"
              onSubmit={onSubmit}
              showName={true}
              showOrganization={true}
              showPhone={true}
              showEmail={true}
              showPassword={true}
              buttonText="Register"
              loading={loading}
              errors={errors}
            />
            <Flex align="center" css={{ color: "$hiContrast" }}>
              Already have an account?&nbsp;
              <Link href="/login" passHref>
                <A>Log in</A>
              </Link>
            </Flex>
          </Flex>
        </Container>
      </Box>
    </Layout>
  );
};

export default RegisterPage;
