import {
  Box,
  Flex,
  Container,
  Link as A,
  IconButton
} from "@theme-ui/components";
import Link from "../Link";
import { useApi } from "../../hooks";
import React, { useCallback, useEffect, useState } from "react";
import { FiMenu } from "react-icons/fi";
import Menu from "./menu";
import { useRouter } from "next/router";
import Button from "../Button";
import NavigationBreadcrumb, { BreadcrumbItem } from "./breadcrumb";

const sidesWidth = "210px"; // We provide the same value for the logo and the CTAs so the center links are really centered.

type Props = {
  links: React.ComponentProps<typeof Link>[];
  breadcrumb?: BreadcrumbItem[];
};

const NavigationBase = ({ links, breadcrumb }: Props) => {
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
            <NavigationBreadcrumb
              breadcrumb={breadcrumb}
              withLogoType={!isDashboard}
            />
          </div>
          <Flex
            sx={{
              display: ["none", "none", "flex"],
              width: "100%",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            {links.map((link) => (
              <Link {...link} key={`nav-link-${link.href}`} variant="nav" />
            ))}
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
                <Link
                  href="/login"
                  variant="nav"
                  sx={{ fontWeight: 600, mr: 3 }}
                >
                  Log in
                </Link>
                <Button
                  variant="buttons.secondarySmall"
                  href="/register"
                  isLink
                >
                  Sign up
                </Button>
              </>
            )}
            {loggedIn && (
              <>
                {user && user.admin && !isDashboard && (
                  <Link href="/app/admin" variant="nav">
                    Admin
                  </Link>
                )}
                <A variant="nav" onClick={() => logout()}>
                  Log Out
                </A>
                {!isDashboard && (
                  <Link
                    href="/app/user"
                    variant="buttons.outlineSmall"
                    sx={{ ml: 2 }}
                  >
                    Dashboard
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
        links={links}
        breadcrumb={breadcrumb}
      />
    </Box>
  );
};

export default NavigationBase;
