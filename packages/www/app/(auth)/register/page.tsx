'use client';

import Layout from "layouts/auth";
import { withRecaptcha } from "layouts/withRecaptcha";
import Login from "../../../components/Login";
import Register from "../../../components/Register";
import {
  Flex,
  Box,
  Button,
  Text,
  Container,
  Link as A,
} from "@livepeer/design-system";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { Register as Content } from "content";
import Link from "next/link";
import { useApi, useLoggedIn } from "../../../hooks";
import { useJune, events } from "hooks/use-june";

const emailVerificationMode =
  process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_MODE === "true";

const shouldRecaptcha = !!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

const RegisterPage = () => {
  useLoggedIn(false);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();
  const June = useJune();
  const router = useRouter();
  const { register, verify, user } = useApi();

  const { email, emailValidToken, selectedPlan } = router.query;

  useEffect(() => {
    if (email && emailValidToken) {
      verify(email, emailValidToken).then(() => {
        if (selectedPlan === "1") {
          router.replace("/settings/billing/plans?promptUpgrade=true");
        } else {
          router.replace("/");
        }
      });
    }
  }, [email, emailValidToken]);

  useEffect(() => {
    if (user) {
      if (emailVerificationMode && user.emailValid === false) {
        router.replace("/verify");
      } else {
        router.replace("/");
      }
    }
  }, [user]);

  const trackEvent = useCallback(() => {
    if (June) June.track(events.onboarding.register);
  }, [June]);

  const onSubmit = async ({
    email,
    password,
    firstName,
    lastName,
    organization,
    phone,
  }) => {
    if (shouldRecaptcha && !executeRecaptcha) {
      console.log("Execute recaptcha not yet available");
      return;
    }

    setLoading(true);
    setErrors([]);
    let recaptchaToken;
    if (shouldRecaptcha) {
      recaptchaToken = await executeRecaptcha("register");
    }
    const selectedPlan = router.query?.selectedPlan;
    const res = await register({
      email,
      password,
      selectedPlan: selectedPlan ? +selectedPlan : 0,
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(organization && { organization }),
      ...(phone && { phone }),
      recaptchaToken,
    });

    trackEvent();

    // Don't need to worry about the success case, we'll redirect
    if (res.errors) {
      setErrors(res.errors);
      setLoading(false);
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
            width: "100%",
          }}>
          <Flex
            css={{
              justifyContent: "center",
              flexGrow: 1,
              flexDirection: "column",
              py: "$3",
            }}>
            <Register
              id="register"
              onSubmit={onSubmit}
              buttonText="Create account"
              loading={loading}
              errors={errors}
            />
            <Box css={{ maxWidth: 500, mx: "auto", width: "100%" }}>
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
                Have an account?
                <Link href="/login" passHref legacyBehavior>
                  <A>Sign in instead</A>
                </Link>
              </Text>
            </Box>
          </Flex>
        </Container>
      </Box>
    </Layout>
  );
};

const RegisterPageWithRecaptcha: any = withRecaptcha(RegisterPage);
RegisterPageWithRecaptcha.theme = "dark-theme-gray";

export default RegisterPageWithRecaptcha;
