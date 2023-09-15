import {
  Box,
  Button,
  Flex,
  Link as A,
  Container,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
} from "@livepeer/design-system";
import { useApi } from "hooks";
import React, { useCallback, useEffect, useState } from "react";
import Menu from "./mobile/menu";
import { useRouter } from "next/router";
import NavigationBreadcrumb, { BreadcrumbItem } from "./breadcrumb";
import Link from "next/link";
import { FiChevronDown, FiArrowUpRight } from "react-icons/fi";
import Guides from "components/Site/Guides";

const sidesWidth = "250px"; // We provide the same value for the logo and the CTAs so the center links are really centered.

export const StyledServerIcon = ({ ...props }) => (
  <Box as="svg" viewBox="0 0 24 24" {...props}>
    <path d="M20 13H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zM7 19c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM20 3H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zM7 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"></path>
  </Box>
);

type Props = {
  links;
  breadcrumb?: BreadcrumbItem[];
  withShadow?: boolean;
  navBackgroundColor?: string;
  css?: any;
};

const NavigationBase = ({
  links,
  breadcrumb,
  navBackgroundColor = "transparent",
  css,
}: Props) => {
  const { pathname } = useRouter();
  const [_hasScrolled, setHasScrolled] = useState(false);
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
    <Box
      css={{
        position: "sticky",
        pt: 1,
        zIndex: 100,
        top: 0,
        bc: "white",
        // boxShadow:
        //   "rgba(0, 0, 0, 0.02) 0px 30px 30px, rgba(0, 0, 0, 0.03) 0px 0px 8px, rgba(0, 0, 0, 0.05) 0px 1px 0px",
      }}>
      <Guides backgroundColor={navBackgroundColor} />
      <Container
        size="5"
        css={{
          width: "100%",
          px: "$2",
          py: 0,
          position: "relative",
          zIndex: 11,
        }}>
        <Box
          css={{
            position: "relative",
            ...css,
          }}>
          <Box
            css={{
              mx: "$3",
            }}>
            <Flex
              css={{
                py: "$4",
                justifyContent: "space-between",
                ai: "center",
              }}>
              <Box>
                <NavigationBreadcrumb
                  navBackgroundColor={navBackgroundColor}
                  breadcrumb={breadcrumb}
                />
              </Box>
              <Flex align="center">
                <Flex
                  css={{
                    display: "none",
                    "@bp2": {
                      display: "flex",
                    },
                    ai: "center",
                    justifyContent: "flex-end",
                    minWidth: sidesWidth,
                    lineHeight: 1,
                    mr: 20,
                  }}>
                  {links.map((link, i) => {
                    return link?.children ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <A
                            as={Box}
                            css={{
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              fontSize: "$3",
                              fontWeight: 500,
                              textDecoration: "none",
                              mx: "$3",
                              color: "$hiContrast",
                              "&:hover": {
                                textDecoration: "none",
                              },
                            }}>
                            {link.label}
                            <FiChevronDown />
                          </A>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" css={{ p: "$2" }}>
                          <DropdownMenuGroup>
                            {link.children.map((child) => {
                              return (
                                <DropdownMenuItem
                                  css={{
                                    height: 54,
                                    display: "flex",
                                    alignItems: "center",
                                    position: "relative",
                                    overflow: "hidden",
                                    p: 0,
                                    "&[data-highlighted]": {
                                      bc: "transparent",
                                    },
                                  }}>
                                  <Link
                                    href={`${link.href}${child.href}`}
                                    passHref
                                    legacyBehavior>
                                    <A
                                      css={{
                                        display: "flex",
                                        px: 30,
                                        width: "100%",
                                        height: "100%",
                                        fontSize: "$3",
                                        textDecoration: "none",
                                        "&:hover": {
                                          bc: "$green3",
                                          textDecoration: "none",
                                        },
                                      }}>
                                      {child.label}
                                    </A>
                                  </Link>
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Link
                        href={link.href}
                        key={`nav-link-${i}`}
                        passHref
                        legacyBehavior>
                        <A
                          target={link.isExternal ? "_blank" : null}
                          css={{
                            display: "flex",
                            fontSize: "$3",
                            fontWeight: 500,
                            textDecoration: "none",
                            mx: "$3",
                            lineHeight: 1,
                            color: "$hiContrast",
                          }}>
                          {link.label}
                          {link.isExternal && <FiArrowUpRight />}
                        </A>
                      </Link>
                    );
                  })}
                </Flex>

                <Flex>
                  {!loggedIn && (
                    <Box
                      css={{
                        display: "none",
                        "@bp2": {
                          display: "block",
                        },
                      }}>
                      <Link href="/login" passHref legacyBehavior>
                        <A>
                          <Button variant="green" size={3}>
                            Sign in
                          </Button>
                        </A>
                      </Link>
                    </Box>
                  )}
                  {loggedIn && (
                    <Box
                      css={{
                        display: "none",
                        "@bp2": {
                          display: "block",
                        },
                      }}>
                      {isDashboard && (
                        <Link
                          href="https://docs.livepeer.studio"
                          passHref
                          legacyBehavior>
                          <A target="_blank">Docs</A>
                        </Link>
                      )}
                      {isDashboard && (
                        <Link href="/contact" passHref legacyBehavior>
                          <A>Contact</A>
                        </Link>
                      )}

                      {!isDashboard && (
                        <Link href="/dashboard" passHref legacyBehavior>
                          <A
                            css={{
                              fontSize: "$4",
                              fontWeight: 500,
                              textDecoration: "none",
                              textTransform: "uppercase",
                              display: "none",
                              position: "relative",
                              "@bp2": {
                                display: "block",
                              },
                              "&:hover": {
                                textDecoration: "none",
                              },
                              "&:after": {
                                content: '""',
                                position: "absolute",
                                left: -14,
                                borderTopLeftRadius: 10,
                                borderTopRightRadius: 12,
                                borderBottomLeftRadius: 4,
                                borderBottomRightRadius: 4,
                                zIndex: 1,
                                top: -14,
                                bc: "#fff",
                                height: 48,
                                width: 80,
                                transform: "skew(35deg)",
                                display:
                                  navBackgroundColor === "transparent"
                                    ? "block"
                                    : "none",
                              },
                              "&:before": {
                                content: '""',
                                position: "absolute",
                                left: 22,
                                borderTopLeftRadius: 10,
                                borderTopRightRadius: 12,
                                borderBottomLeftRadius: 4,
                                borderBottomRightRadius: 4,
                                zIndex: 1,
                                top: -14,
                                bc: "#fff",
                                height: 48,
                                width: 110,
                                display:
                                  navBackgroundColor === "transparent"
                                    ? "block"
                                    : "none",
                              },
                            }}>
                            <Box
                              css={{
                                color:
                                  navBackgroundColor === "transparent"
                                    ? "$loContrast"
                                    : "$hiContrast",
                                position: "relative",
                                zIndex: 2,
                                width: 122,
                                textAlign: "center",
                              }}>
                              Dashboard
                            </Box>
                          </A>
                        </Link>
                      )}
                    </Box>
                  )}
                </Flex>
                <Flex
                  css={{
                    textTransform: "uppercase",
                    cursor: "pointer",
                    "@bp2": {
                      display: "none",
                    },
                  }}
                  onClick={() => setMobileMenuIsOpen(true)}>
                  Menu
                </Flex>
              </Flex>
            </Flex>
          </Box>
          <Menu
            mobileMenuIsOpen={mobileMenuIsOpen}
            setMobileMenuIsOpen={setMobileMenuIsOpen}
            user={user}
            token={token}
            links={links}
            breadcrumb={breadcrumb}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default NavigationBase;
