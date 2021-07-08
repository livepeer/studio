/** @jsx jsx */
import { jsx } from "theme-ui";
import { Box, Flex, Text } from "@theme-ui/components";
import { useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../layouts";
import { useLoggedIn, useApi } from "hooks";

const Container = ({ children }) => (
  <Layout>
    <Flex sx={{ flexGrow: 1, alignItems: "center", justifyContent: "center" }}>
      <Box>{children}</Box>
    </Flex>
  </Layout>
);

export default () => {
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

  if (email && emailValidToken) {
    return (
      <Container>
        <Flex
          sx={{
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            height: "calc(100vh - 280px)",
            mb: 65,
          }}>
          Verifying...
        </Flex>
      </Container>
    );
  }
  return (
    <Container>
      <Flex
        sx={{
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          height: "calc(100vh - 280px)",
          mb: 65,
        }}>
        <Text sx={{ my: 3, fontSize: 4, fontWeight: 600 }}>
          Check your email
        </Text>
        <Box sx={{ fontSize: 1 }}>
          <Box>We've sent you a link to verify your email.</Box>
          <Box>
            Please check your inbox at
            <Box as="span" sx={{ fontWeight: 600 }}>
              {" "}
              {user?.email}.
            </Box>
          </Box>
        </Box>
      </Flex>
    </Container>
  );
};
