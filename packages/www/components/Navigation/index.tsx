import {
  Box,
  Flex,
  Container,
  Link as A,
  IconButton
} from "@theme-ui/components";
import Link from "next/link";
import { useApi } from "../../hooks";
import React, { useCallback, useEffect, useState } from "react";
import { FiMenu } from "react-icons/fi";
import Menu from "./menu";
import { useRouter } from "next/router";
import Logo from "../Logo";

const sidesWidth = "210px"; // We provide the same value for the logo and the CTAs so the center links are really centered.

const Navigation = () => {
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
        transition: "box-shadow .3s, top .3s, background-color .3s",
        bg: hasScrolled ? "background" : "transparent",
        boxShadow: hasScrolled
          ? "rgba(0, 0, 0, 0.02) 0px 30px 30px, rgba(0, 0, 0, 0.03) 0px 0px 8px, rgba(0, 0, 0, 0.05) 0px 1px 0px"
          : "none"
      }}
    >
      <Container>
        <Flex
          sx={{
            py: 3,
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div
            sx={{ minWidth: sidesWidth, display: "flex", alignItems: "center" }}
          >
            <Logo logoType={!isDashboard} />
          </div>
          <Flex
            sx={{
              display: ["none", "none", "flex"],
              width: "100%",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Link href="/docs" passHref>
              <A variant="nav">Docs</A>
            </Link>
            <Link href="/#contactSection" passHref>
              <A variant="nav">Contact Us</A>
            </Link>
          </Flex>
          <Flex
            sx={{
              display: ["none", "none", "flex"],
              alignItems: "center",
              justifyContent: "flex-end",
              minWidth: sidesWidth
            }}
          >
            {!loggedIn && (
              <>
                <Link href="/login" passHref>
                  <A variant="nav" sx={{ fontWeight: 600, mr: 3 }}>
                    Log in
                  </A>
                </Link>
                <Link href="/register" passHref>
                  <A variant="buttons.secondarySmall">Sign up</A>
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
              fontSize: 6
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

export default Navigation;
