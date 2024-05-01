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
import { FiChevronDown, FiChevronRight, FiArrowUpRight } from "react-icons/fi";
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
  const isDashboard = pathname.includes("/");

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

  const ChevronLinkStyles = {
    display: "flex",
    gap: "$1",
    ai: "center",
    "&:hover": {
      ".chevronRight": {
        paddingLeft: "3px",
        transition: ".2s",
      },
      textDecoration: "none",
    },
  };

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
              <Flex
                css={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                }}>
                <Flex
                  css={{
                    display: "none",
                    "@bp2": {
                      display: "flex",
                    },
                    alignItems: "center",
                    justifyContent: "flex-end",
                    minWidth: sidesWidth,
                    lineHeight: 1,
                    mr: 20,
                    ml: "$6",
                  }}>
                  {links.map((link, i) => {
                    return link?.children ? (
                      <DropdownMenu key={`dropdown-menu-${i}`}>
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
                        <DropdownMenuContent
                          placeholder="dropdown-menu-content"
                          align="start"
                          css={{
                            p: 0,
                            mt: "$2",
                            border: "1px solid $neutral6",
                          }}>
                          <Flex css={{ borderRadius: "$4" }}>
                            <DropdownMenuGroup
                              css={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-around",
                              }}>
                              {link.children.map((child, i) => {
                                return (
                                  <DropdownMenuItem
                                    key={`dropdown-menu-item-${i}`}
                                    css={{
                                      mx: "$2",
                                      borderRadius: "$4",
                                      height: 54,
                                      display: "flex",
                                      alignItems: "center",
                                      position: "relative",
                                      overflow: "hidden",
                                      py: "$1",
                                      px: "$3",
                                      "&[data-highlighted]": {
                                        bc: "transparent",
                                      },
                                    }}>
                                    <Link
                                      href={`${link.href}${child.href}`}
                                      passHref
                                      legacyBehavior>
                                      <Flex
                                        align="center"
                                        css={{
                                          fontSize: "$3",
                                          gap: "$3",
                                          cursor: "pointer",
                                          "&:hover": {
                                            ".chevronRight": {
                                              paddingLeft: "3px",
                                              transition: ".2s",
                                            },
                                            textDecoration: "none",
                                          },
                                        }}>
                                        <Flex
                                          justify="center"
                                          align="center"
                                          css={{
                                            border: "1px solid $neutral6",
                                            borderRadius: "$4",
                                            color: "$neutral12",
                                            bc: "$neutral4",
                                            minWidth: 38,
                                            minHeight: 38,
                                          }}>
                                          {child.icon}
                                        </Flex>
                                        <Box>
                                          <Flex
                                            align="center"
                                            gap="1"
                                            css={{ mb: "$1" }}>
                                            {child.label}
                                            <FiChevronRight
                                              className="chevronRight"
                                              style={{
                                                position: "relative",
                                                transition: ".2s",
                                              }}
                                            />
                                          </Flex>
                                          <Box
                                            css={{
                                              color: "$neutral10",
                                              fontSize: "$2",
                                            }}>
                                            {child.excerpt}
                                          </Box>
                                        </Box>
                                      </Flex>
                                    </Link>
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuGroup>
                            <Flex
                              direction="column"
                              css={{
                                borderLeft: "1px solid $neutral6",
                                bc: "$neutral3",
                                borderTopRightRadius: "$3",
                                borderBottomRightRadius: "$3",
                                p: "$4",
                                minWidth: 296,
                              }}>
                              <Box
                                css={{
                                  fontSize: "$2",
                                  textTransform: "uppercase",
                                  color: "$neutral9",
                                  mb: "$4",
                                }}>
                                Use Cases
                              </Box>
                              <Flex
                                direction="column"
                                gap={2}
                                css={{
                                  fontSize: "$2",
                                  mb: "$6",
                                  color: "$neutral12",
                                  a: {
                                    textDecoration: "none",
                                  },
                                }}>
                                <Link
                                  href="/use-cases/social-media"
                                  passHref
                                  legacyBehavior>
                                  <A css={{ ...ChevronLinkStyles }}>
                                    Social Apps{" "}
                                    <FiChevronRight
                                      className="chevronRight"
                                      style={{
                                        position: "relative",
                                        transition: ".2s",
                                      }}
                                    />
                                  </A>
                                </Link>
                                <Link
                                  href="/use-cases/creator-economy"
                                  passHref
                                  legacyBehavior>
                                  <A css={{ ...ChevronLinkStyles }}>
                                    Creator Economy{" "}
                                    <FiChevronRight
                                      className="chevronRight"
                                      style={{
                                        position: "relative",
                                        transition: ".2s",
                                      }}
                                    />
                                  </A>
                                </Link>
                              </Flex>
                              <Box
                                css={{
                                  fontSize: "$2",
                                  textTransform: "uppercase",
                                  color: "$neutral9",
                                  mb: "$4",
                                }}>
                                Compare Livepeer Studio
                              </Box>
                              <Flex
                                direction="column"
                                gap={2}
                                css={{
                                  fontSize: "$2",
                                  color: "$neutral12",
                                  a: {
                                    textDecoration: "none",
                                  },
                                }}>
                                <Link
                                  href="/compare/livepeer-studio-vs-mux"
                                  passHref
                                  legacyBehavior>
                                  <A css={{ ...ChevronLinkStyles }}>
                                    Livepeer Studio vs Mux
                                    <FiChevronRight
                                      className="chevronRight"
                                      style={{
                                        position: "relative",
                                        transition: ".2s",
                                      }}
                                    />
                                  </A>
                                </Link>
                                <Link
                                  href="/compare/livepeer-studio-vs-cloudflare-stream"
                                  passHref
                                  legacyBehavior>
                                  <A css={{ ...ChevronLinkStyles }}>
                                    Livepeer Studio vs Cloudflare Stream
                                    <FiChevronRight
                                      className="chevronRight"
                                      style={{
                                        position: "relative",
                                        transition: ".2s",
                                      }}
                                    />
                                  </A>
                                </Link>
                              </Flex>
                            </Flex>
                          </Flex>
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
                          <Button variant="neutral" css={{ mr: "$3" }} size={3}>
                            Sign in
                          </Button>
                        </A>
                      </Link>
                    </Box>
                  )}
                  {!loggedIn && (
                    <Box
                      css={{
                        display: "none",
                        "@bp2": {
                          display: "block",
                        },
                      }}>
                      <Link href="/register" passHref legacyBehavior>
                        <A>
                          <Button variant="green" size={3}>
                            Sign Up
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
                        <Link href="/" passHref legacyBehavior>
                          <A>
                            <Button variant="green" size={3}>
                              Dashboard
                            </Button>
                          </A>
                        </Link>
                      )}
                    </Box>
                  )}
                </Flex>
              </Flex>
              <Flex>
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
