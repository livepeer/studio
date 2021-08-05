import { useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "layouts/main";
import { useLoggedIn, useApi } from "hooks";
import {
  Container,
  Flex,
  Box,
  Heading,
  Text,
} from "@livepeer.com/design-system";
import Guides from "components/Marketing/Guides";

const Verify = () => {
  useLoggedIn();
  const router = useRouter();
  const { verify, user } = useApi();
  const { email, emailValidToken, selectedPlan } = router.query;

  useEffect(() => {
    if (email && emailValidToken) {
      verify(email, emailValidToken).then(() => {
        if (selectedPlan === "1") {
          router.replace("/dashboard/billing/plans?promptUpgrade=true");
        } else {
          router.replace("/dashboard");
        }
      });
    }
  }, [email, emailValidToken]);

  // If they've already validated their email, get 'em out of here
  useEffect(() => {
    if (user && user.emailValid !== false) {
      router.replace("/dashboard");
    }
  }, [user]);

  return (
    <Layout>
      <Guides />
      <Box css={{ position: "relative" }}>
        <Container
          size="3"
          css={{
            px: "$6",
            py: "$8",
            width: "100%",
            "@bp3": {
              py: "$9",
              px: "$4",
            },
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
                height: "calc(100vh - 280px)",
                mb: 65,
              }}>
              {email && emailValidToken ? (
                <Heading>Verifying...</Heading>
              ) : (
                <>
                  <Heading size="2" css={{ my: "$3", fontWeight: 600 }}>
                    Check your email
                  </Heading>
                  <Box css={{ fontSize: "$2" }}>
                    <Text variant="gray" size="3">
                      We've sent you a link to verify your email.
                    </Text>
                    <Text variant="gray" size="3">
                      Please check your inbox at
                      <Box
                        as="span"
                        css={{ color: "$hiContrast", fontWeight: 600 }}>
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
    </Layout>
  );
};

export default Verify;
