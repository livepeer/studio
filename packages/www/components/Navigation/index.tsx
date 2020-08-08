import {
  Box,
  Flex,
  Container,
  Link as A,
  IconButton,
} from "@theme-ui/components";
import Link from "next/link";
import Logo from "../../public/img/logo.svg";
import { useApi } from "../../hooks";
import React, { useEffect, useState } from "react";
import { FiMenu } from "react-icons/fi";
import Menu from "./menu";
import { useRouter } from "next/router";

export default () => {
  const { pathname } = useRouter();
  const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const { token, user, logout } = useApi();
  const isDashboard = pathname.includes("/app/");

  useEffect(() => {
    if (token) {
      setLoggedIn(true);
    }
  }, [token]);

  return (
    <>
      <Container>
        <Flex
          sx={{
            py: 3,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link href="/" passHref>
            <A
              sx={{
                width: "33.33%",
                textDecoration: "none",
                color: "primary",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <Logo sx={{ color: "primary" }} />
              {!isDashboard && (
                <Box
                  sx={{
                    ml: "12px",
                    fontWeight: 500,
                    fontSize: "18px",
                  }}
                >
                  livepeer.com
                </Box>
              )}
            </A>
          </Link>
          {!isDashboard && (
            <Flex
              sx={{
                width: "33.33%",
                justifyContent: "center",
                alignItems: "center",
                display: ["none", "none", "flex"],
              }}
            >
              <Link href="/docs" passHref>
                <A variant="nav" sx={{ ml: 0 }}>
                  Docs
                </A>
              </Link>
              <Link href="/#contactSection" passHref>
                <A variant="nav">Contact Us</A>
              </Link>
              <Link href="/jobs" passHref>
                <A variant="nav" sx={{ mr: 0 }}>
                  We're hiring
                </A>
              </Link>
            </Flex>
          )}
          {!loggedIn && (
            <Flex
              sx={{
                display: ["none", "none", "flex"],
                width: "33.33%",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <Link href="/login" passHref>
                <A variant="nav" sx={{ fontWeight: 600, ml: 0, mr: 3 }}>
                  Log in
                </A>
              </Link>
              <Link href="/register" passHref>
                <A variant="buttons.secondarySmall" sx={{ m: 0 }}>
                  Sign up
                </A>
              </Link>
            </Flex>
          )}
          {loggedIn && (
            <Flex
              sx={{
                width: "33%",
                display: ["none", "none", "flex"],
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              {isDashboard && (
                <>
                  <Link href="/docs" passHref>
                    <A variant="nav" sx={{ ml: 0 }}>
                      Docs
                    </A>
                  </Link>
                  <Link href="/#contactSection" passHref>
                    <A variant="nav">Contact Us</A>
                  </Link>
                </>
              )}

              {user && user.admin && !isDashboard && (
                <Link href="/app/admin" passHref>
                  <A variant="nav">Admin</A>
                </Link>
              )}

              <A variant="nav" onClick={() => logout()}>
                Log Out
              </A>
              {!isDashboard && (
                <Link href="/app/user" passHref>
                  <A variant="buttons.outlineSmall" sx={{ ml: 2 }}>
                    Dashboard
                  </A>
                </Link>
              )}
            </Flex>
          )}
          <IconButton
            sx={{
              color: "black",
              display: ["flex", "flex", "none"],
              fontSize: 6,
            }}
            onClick={() => setMobileMenuIsOpen(true)}
          >
            <FiMenu size="24px" />
          </IconButton>
        </Flex>
      </Container>
      <Menu
        mobileMenuIsOpen={mobileMenuIsOpen}
        setMobileMenuIsOpen={setMobileMenuIsOpen}
        user={user}
        token={token}
      />
    </>
  );
};
