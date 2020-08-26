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
import React, { useCallback, useEffect, useState } from "react";
import { FiMenu } from "react-icons/fi";
import Menu from "./menu";
import { useRouter } from "next/router";

export default () => {
  const { pathname } = useRouter();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const { token, user, logout } = useApi();
  const isDashboard = pathname.includes("/app/");

  const handleScroll = useCallback(() => {
    const { scrollTop } = document.documentElement;
    if (scrollTop > 0) setHasScrolled(true);
    else setHasScrolled(false);
  }, []);

  useEffect(() => {
    handleScroll();
    document.addEventListener("scroll", handleScroll);

    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (token) {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  }, [token]);

  return (
    <Box
      sx={{
        transition: "box-shadow .3s, top .3s",
        boxShadow: hasScrolled
          ? "rgba(0, 0, 0, 0.02) 0px 30px 30px, rgba(0, 0, 0, 0.03) 0px 0px 8px, rgba(0, 0, 0, 0.05) 0px 1px 0px"
          : "none",
      }}
    >
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
          <Flex
            sx={{
              display: ["none", "none", "flex"],
              width: "100%",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <Link href="/docs" passHref>
              <A variant="nav" sx={{ ml: 0 }}>
                Docs
              </A>
            </Link>
            <Link href="/blog" passHref>
              <A variant="nav">Blog</A>
            </Link>
            <Link href="/contact" passHref>
              <A variant="nav">Contact Us</A>
            </Link>
            {!loggedIn && (
              <>
                <Link href="/login" passHref>
                  <A variant="nav" sx={{ fontWeight: 600, ml: 3, mr: 3 }}>
                    Log in
                  </A>
                </Link>
                <Link href="/register" passHref>
                  <A variant="buttons.secondarySmall" sx={{ m: 0 }}>
                    Sign up
                  </A>
                </Link>
              </>
            )}
            {loggedIn && (
              <>
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
              </>
            )}
          </Flex>
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
    </Box>
  );
};
