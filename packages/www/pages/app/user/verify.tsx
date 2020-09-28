import useApi from "../../../hooks/use-api";
import { Box, Flex, Text } from "@theme-ui/components";
import { useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../../components/Layout";
import useLoggedIn from "../../../hooks/use-logged-in";
import LogoSvg from "../../../public/img/logo.svg";

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
  const { verify, user, logout } = useApi();
  const { email, emailValidToken } = router.query;

  useEffect(() => {
    if (email && emailValidToken) {
      verify(email, emailValidToken).then(() => {
        router.replace("/app/user");
      });
    }
  }, [email, emailValidToken]);

  // If they've already validated their email, get 'em out of here
  useEffect(() => {
    if (user && user.emailValid !== false) {
      router.replace("/app/user");
    }
  }, [user]);

  if (email && emailValidToken) {
    return <Container>Verifying...</Container>;
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
          mb: 65
        }}
      >
        <Flex
          sx={{
            width: 80,
            height: 80,
            alignItems: "center",
            justifyContent: "center",
            bg: "primary",
            borderRadius: 1000
          }}
        >
          <LogoSvg
            sx={{
              color: "background",
              minWidth: 32,
              minHeight: 32
            }}
          />
        </Flex>
        <Text sx={{ my: 3, fontSize: 3, fontWeight: 600 }}>
          Check your email
        </Text>
        <Box sx={{ fontSize: 1 }}>
          <Box>We've sent you a link to verify your email.</Box>
          <Box>
            Please check your inbox at
            <span sx={{ fontWeight: 600 }}> {user?.email}.</span>
          </Box>
        </Box>
      </Flex>
    </Container>
  );
};
