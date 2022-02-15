import {
  Box,
  Flex,
  Text,
  Container,
  Link as A,
} from "@livepeer.com/design-system";
import { useApi } from "hooks";
import React, { useCallback, useEffect, useState } from "react";
import Menu from "./mobile/menu";
import { useRouter } from "next/router";
import NavigationBreadcrumb, { BreadcrumbItem } from "./breadcrumb";
import Link from "next/link";
import Guides from "@components/Marketing/Guides";
import Button from "@components/Marketing/Button";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import NavDropdown from "@components/Marketing/NavDropdown";
import ArrowLink from "../ArrowLink";

const sidesWidth = "250px"; // We provide the same value for the logo and the CTAs so the center links are really centered.

export const StyledServerIcon = ({ ...props }) => (
  <Box as="svg" viewBox="0 0 24 24" {...props}>
    <path d="M20 13H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zM7 19c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM20 3H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zM7 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"></path>
  </Box>
);

const StyledEcommerceIcon = ({ active = false, ...props }) => {
  return (
    <Box
      as="svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <Box
        as="path"
        fill="currentColor"
        fillRule="evenodd"
        d="M5.43 6L5.1 7.22a3 3 0 0 0 5.8 1.56L11.64 6H15a1 1 0 0 1 0 2l-.9 7.11a1 1 0 0 1-1 .89H2.9a1 1 0 0 1-1-.89L1 8a1 1 0 1 1 0-2h4.43zM9.61.02l.97.26a.5.5 0 0 1 .35.6L9.57 6l-.6 2.26a1 1 0 0 1-1.94-.52l2-7.45a.5.5 0 0 1 .58-.27z"
      />
    </Box>
  );
};

const StyledPlatformsIcon = ({ ...props }) => (
  <Box
    as="svg"
    width="14"
    height="16"
    viewBox="0 0 14 16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}>
    <path
      d="M6.98 0a.52.52 0 0 0-.25.08L.24 4.03a.5.5 0 0 0-.24.43c0 .17.1.33.24.42l6.49 3.95c.17.1.37.1.54 0l6.49-3.95a.5.5 0 0 0 .24-.42.5.5 0 0 0-.24-.43L7.27.08a.52.52 0 0 0-.3-.08zm-5.5 6.82l-1.24.76A.5.5 0 0 0 0 8c0 .17.1.33.24.42l6.49 3.96c.17.1.37.1.54 0l6.49-3.96A.5.5 0 0 0 14 8a.5.5 0 0 0-.24-.42l-1.25-.76-4.7 2.86a1.58 1.58 0 0 1-1.62 0l-4.7-2.86zm0 3.54l-1.24.76a.5.5 0 0 0-.24.43c0 .17.1.33.24.42l6.49 3.95c.17.1.37.1.54 0l6.49-3.95a.5.5 0 0 0 .24-.42.5.5 0 0 0-.24-.43l-1.25-.76-4.7 2.87a1.58 1.58 0 0 1-1.62 0l-4.7-2.87z"
      fill="currentColor"
      fillRule="nonzero"
    />
  </Box>
);

type Props = {
  links: React.ComponentProps<typeof Link>[];
  breadcrumb?: BreadcrumbItem[];
  withShadow?: boolean;
  backgroundColor?: string;
  hideGuides?: boolean;
  css?: any;
};

const NavigationBase = ({
  links,
  breadcrumb,
  backgroundColor = "$loContrast",
  withShadow = true,
  hideGuides = false,
  css,
}: Props) => {
  const { pathname } = useRouter();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const { token, user, logout } = useApi();
  const isDashboard = pathname.includes("/dashboard/");

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
    <Box css={{ position: "relative" }}>
      {!hideGuides && <Guides backgroundColor={backgroundColor} />}
      <Box
        css={{
          position: "relative",
          zIndex: mobileMenuIsOpen ? 22 : 22,
          "&:after": {
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "1px",
            margin: 0,
            border: "none",
            background:
              "linear-gradient(90deg,$colors$mauve4,$colors$mauve4 50%,transparent 0,transparent)",
            backgroundSize: "8px 1px",
            content: '""',
          },
          ...css,
        }}>
        <Container
          size="3"
          css={{
            px: "$4",
            mx: "$4",
            "@bp3": {
              px: "$4",
              mx: "auto",
            },
          }}>
          <Flex
            css={{
              py: "$4",
              justifyContent: "space-between",
              ai: "center",
            }}>
            <Box
              css={{
                minWidth: sidesWidth,
                display: "flex",
                alignItems: "center",
              }}>
              <NavigationBreadcrumb breadcrumb={breadcrumb} />
            </Box>
            <Flex
              css={{
                width: "100%",
                justifyContent: "center",
                ai: "center",
                display: "none",
                "@bp2": {
                  display: "flex",
                },
              }}>
              <NavDropdown
                trigger={
                  <Box
                    css={{
                      fontSize: "$3",
                      fontWeight: 500,
                      textDecoration: "none",
                      mx: "$3",
                      cursor: "pointer",
                      color: "$hiContrast",
                    }}>
                    Products
                  </Box>
                }>
                <Box css={{ mb: "$3" }}>
                  <Flex>
                    <StyledPlatformsIcon
                      css={{ color: "$hiContrast", mt: "4px", mr: "$3" }}
                    />
                    <Box>
                      <ArrowLink
                        hideArrow
                        href="/products/streaming-service"
                        css={{ fontWeight: 500, mb: "$2" }}>
                        Streaming Service
                      </ArrowLink>

                      <Box css={{ color: "$mauve5" }}>
                        <ArrowLink
                          hideArrow
                          color="$mauve9"
                          href="/use-cases/creator-platforms">
                          <Text variant="gray" css={{ py: "$1" }}>
                            For creator apps
                          </Text>
                        </ArrowLink>
                        <ArrowLink
                          hideArrow
                          color="$mauve9"
                          href="/use-cases/game-streaming-platforms">
                          <Text variant="gray" css={{ py: "$1" }}>
                            For live gaming apps
                          </Text>
                        </ArrowLink>
                        <ArrowLink
                          hideArrow
                          color="$mauve9"
                          href="/use-cases/music-streaming-platforms">
                          <Text variant="gray" css={{ py: "$1" }}>
                            For live music apps
                          </Text>
                        </ArrowLink>
                        <ArrowLink
                          hideArrow
                          color="$mauve9"
                          href="/use-cases/24x7-channels">
                          <Text variant="gray" css={{ py: "$1" }}>
                            For 24x7 video apps
                          </Text>
                        </ArrowLink>

                        <ArrowLink
                          hideArrow
                          color="$mauve9"
                          href="/use-cases/ecommerce">
                          <Text variant="gray" css={{ py: "$1" }}>
                            For e-commerce apps
                          </Text>
                        </ArrowLink>
                      </Box>
                    </Box>
                  </Flex>
                </Box>
                <Box>
                  <Flex css={{ alignItems: "center" }}>
                    <StyledServerIcon
                      css={{
                        fill: "white",
                        mt: "0px",
                        mr: "$3",
                        width: "16px",
                      }}
                    />
                    <ArrowLink
                      hideArrow
                      href="/products/media-server"
                      css={{ fontWeight: 500, fontSize: "$3" }}>
                      Media Server
                    </ArrowLink>
                  </Flex>
                </Box>
              </NavDropdown>
              {links.map((link, i) => {
                return (
                  <Link href={link.href} key={`nav-link-${i}`} passHref>
                    <A
                      css={{
                        display: "block",
                        fontSize: "$3",
                        fontWeight: 500,
                        textDecoration: "none",
                        mx: "$3",
                      }}>
                      {link.children}
                    </A>
                  </Link>
                );
              })}
            </Flex>
            <Flex
              css={{
                display: "none",
                "@bp2": {
                  display: "flex",
                },
                ai: "center",
                justifyContent: "flex-end",
                minWidth: sidesWidth,
              }}>
              {!loggedIn && (
                <>
                  <Link href="/login" passHref>
                    <A
                      css={{
                        fontSize: "$3",
                        fontWeight: 500,
                        textDecoration: "none",
                        mr: "$4",
                      }}>
                      Log in
                    </A>
                  </Link>
                  <Link href="/register" passHref>
                    <Button as="a" arrow>
                      Sign up
                    </Button>
                  </Link>
                </>
              )}
              {loggedIn && (
                <>
                  {user && user.admin && !isDashboard && (
                    <Link href="/app/admin" passHref>
                      <A
                        css={{
                          fontSize: "$3",
                          fontWeight: 500,
                          textDecoration: "none",
                          mr: "$4",
                        }}>
                        Admin
                      </A>
                    </Link>
                  )}
                  {isDashboard && (
                    <Link href="/docs/guides" passHref>
                      <A>Docs</A>
                    </Link>
                  )}
                  {isDashboard && (
                    <Link href="/contact" passHref>
                      <A>Contact</A>
                    </Link>
                  )}

                  {!isDashboard && (
                    <Link href="/dashboard" passHref>
                      <Button as="a" arrow>
                        Dashboard
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </Flex>
            <Flex
              css={{
                backgroundColor: "$panel",
                borderRadius: 20,
                fontSize: 6,
                py: "$1",
                px: "$3",
                cursor: "pointer",
                flexShrink: 0,
                "@bp2": {
                  display: "none",
                },
              }}
              onClick={() => setMobileMenuIsOpen(true)}>
              <HamburgerMenuIcon />
            </Flex>
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
    </Box>
  );
};

export default NavigationBase;
