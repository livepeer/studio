'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "layouts/auth";
import { useApi } from "hooks";
import {
  Container,
  Flex,
  Box,
  Button,
  Heading,
  Text,
  useSnackbar,
} from "@livepeer/design-system";

import Spinner from "components/Spinner";

const VerifyPage = () => {
  const router = useRouter();
  const { user, verifyNewEmail } = useApi();

  const [errors, setErrors] = useState<string | null>(null);

  const { email, emailValidToken, selectedPlan } = router.query;

  useEffect(() => {
    if (email && emailValidToken) {
      verifyNewEmail(email, emailValidToken)
        .then(() => {
          if (selectedPlan === "1") {
            router.replace("/settings/billing/plans?promptUpgrade=true");
          } else {
            router.replace("/");
          }
        })
        .catch((e) => {
          setErrors(e.message);
        });
    }
  }, [email, emailValidToken]);

  // If they've already validated their email, get 'em out of here
  useEffect(() => {
    if (user?.emailValid === true) {
      router.replace("/");
    }
  }, [user]);

  return (
    <Layout>
      <Verify errors={errors} email={email} emailValidToken={emailValidToken} />
    </Layout>
  );
};

VerifyPage.theme = "dark-theme-gray";
export default VerifyPage;

const Verify = ({
  errors,
  email,
  emailValidToken,
}: {
  errors?: string | null;
  email?: string | string[];
  emailValidToken?: string | string[];
}) => {
  const { user, verify, verifyEmail } = useApi();
  const [loading, setLoading] = useState<boolean>(false);
  const [openSnackbar] = useSnackbar();

  const resendVerificationEmail = async () => {
    setLoading(true);
    const res = await verifyEmail(email);
    setLoading(false);

    if (res.errors) {
      openSnackbar(`Errors: ${res.errors.join(", ")}`);
    } else {
      openSnackbar(
        `We've sent you a link to verify your email. Please check your inbox at ${email}`,
      );
    }
  };

  return (
    <Box css={{ position: "relative" }}>
      <Container
        size="3"
        css={{
          width: "100%",
        }}>
        <Flex
          css={{
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
          }}>
          <Flex
            css={{
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              height: "calc(100vh - 70px)",
            }}>
            {email && emailValidToken ? (
              <>
                {errors ? (
                  <Heading>
                    Email verification failed:{" "}
                    <Box as="span" css={{ color: "$primary11" }}>
                      {errors}.
                    </Box>
                    <br /> Please access the link you received by email again.
                    <Box css={{ mt: "$5", mb: "$3" }}>
                      Or we'll send you a link to verify your email, please
                      verify your email again.
                    </Box>
                    <Button
                      as="a"
                      size="2"
                      css={{ cursor: "default" }}
                      variant="primary"
                      onClick={() => resendVerificationEmail()}>
                      {loading && (
                        <Spinner
                          css={{
                            color: "$hiContrast",
                            width: 16,
                            height: 16,
                            mr: "$2",
                          }}
                        />
                      )}
                      Resend the verification email
                    </Button>
                  </Heading>
                ) : (
                  <Heading>Verifying... </Heading>
                )}
              </>
            ) : (
              <>
                <Heading size="2" css={{ my: "$3" }}>
                  Check your email
                </Heading>
                <Box css={{ fontSize: "$2" }}>
                  <Text variant="neutral" size="3">
                    We've sent you a link to verify your email.
                  </Text>
                  <Text variant="neutral" size="3">
                    Please check your inbox at
                    <Box
                      as="span"
                      css={{ color: "$hiContrast", fontWeight: 500 }}>
                      {" "}
                      {user?.email}.
                    </Box>
                  </Text>
                </Box>
              </>
            )}
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
};
