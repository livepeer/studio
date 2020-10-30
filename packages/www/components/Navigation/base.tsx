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
import Menu from "./mobile/menu";
import { useRouter } from "next/router";
import Button from "../Button";
import NavigationBreadcrumb, { BreadcrumbItem } from "./breadcrumb";
import { SxStyleProp } from "theme-ui";

const sidesWidth = "280px"; // We provide the same value for the logo and the CTAs so the center links are really centered.

type Props = {
  links: React.ComponentProps<typeof Link>[];
  breadcrumb?: BreadcrumbItem[];
  withShadow?: boolean;
  pushSx?: SxStyleProp;
};

const NavigationBase = ({
  links,
  breadcrumb,
  withShadow = true,
  pushSx
}: Props) => {
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
        boxShadow:
          hasScrolled && withShadow
            ? "rgba(0, 0, 0, 0.02) 0px 30px 30px, rgba(0, 0, 0, 0.03) 0px 0px 8px, rgba(0, 0, 0, 0.05) 0px 1px 0px"
            : "none",
        position: "sticky",
        top: 0,
        zIndex: mobileMenuIsOpen ? 22 : 22,
        ...pushSx
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
          {!isDashboard && (
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
          )}
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
                  sx={{ py: "6px" }}
                  variant="buttons.primarySmall"
                  href="/register"
                  isLink
                >
                  Sign up
                </Button>
              </>
            )}
            {loggedIn && (
              <>
                {isDashboard &&
                  user?.stripeProductId === "prod_0" &&
                  user?.emailValid !== false && (
                    <Button
                      sx={{ mr: 4, py: "6px" }}
                      isLink
                      href="/app/user/plans"
                      variant="buttons.gradientOutlineSmall"
                    >
                      Upgrade
                    </Button>
                  )}
                {user && user.admin && !isDashboard && (
                  <Link sx={{ mr: 3 }} href="/app/admin" variant="nav">
                    Admin
                  </Link>
                )}
                {isDashboard && (
                  <Link href="/docs" variant="nav">
                    Docs
                  </Link>
                )}
                {isDashboard && (
                  <Link href="/contact" variant="nav">
                    Contact
                  </Link>
                )}
                <A
                  variant="nav"
                  sx={{ mr: 3, cursor: "pointer" }}
                  onClick={() => logout()}
                >
                  Log Out
                </A>
                {!isDashboard && (
                  <Button
                    sx={{ py: "6px" }}
                    isLink
                    href="/app/user"
                    variant="buttons.primarySmall"
                  >
                    Dashboard
                  </Button>
                )}
              </>
            )}
          </Flex>
          <IconButton
            sx={{
              color: "black",
              display: ["flex", "flex", "none"],
              fontSize: 6,
              flexShrink: 0
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
