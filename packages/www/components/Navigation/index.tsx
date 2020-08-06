import {
  Box,
  Flex,
  Container,
  Link as A,
  IconButton,
} from "@theme-ui/components";
import Button from "../Button";
import Link from "next/link";
import Logo from "../../public/img/logo.svg";
import { useApi } from "../../hooks";
import React, { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

const navHeight = "70px";

export default () => {
  const [mobileMenuIsOpen, setMobileMenuIsOpen] = useState(false);
  const { token, user } = useApi();
  return (
    <>
      <Container>
        <Flex
          sx={{
            py: 3,
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <Link href="/" passHref>
            <A
              sx={{
                display: "flex",
                alignItems: "center",
                marginRight: "auto",
                cursor: "pointer",
              }}
            >
              <Logo sx={{ width: 120, color: "primary" }} />
            </A>
          </Link>
          <Flex
            sx={{ alignItems: "center", display: ["none", "none", "flex"] }}
          >
            <Link href="/#contactSection" passHref>
              <A variant="nav">Contact Us</A>
            </Link>
            <Link href="/docs" passHref>
              <A variant="nav">Documentation</A>
            </Link>
            {!token && (
              <>
                <Link href="/login" passHref>
                  <A variant="nav">Log in</A>
                </Link>
                <Link href="/register" passHref>
                  <Button as="a" variant="outline" sx={{ ml: 3 }}>
                    Sign up
                  </Button>
                </Link>
              </>
            )}
            {token && (
              <>
                <Link href="/app/user" passHref>
                  <A variant="nav">My Account</A>
                </Link>
              </>
            )}
            {user && user.admin && (
              <>
                <Link href="/app/admin" passHref>
                  <A variant="nav">Admin</A>
                </Link>
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
      <Box
        sx={{
          bg: "white",
          position: "fixed",
          top: 0,
          height: mobileMenuIsOpen ? "100vh" : 0,
          transition: "height .2s",
          overflow: "hidden",
          width: "100%",
          zIndex: "dropdown",
          visibility: mobileMenuIsOpen ? "visible" : "hidden",
        }}
      >
        <Container
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 3,
          }}
        >
          <Link href="/" passHref>
            <A
              sx={{
                display: "flex",
                alignItems: "center",
                marginRight: "auto",
                cursor: "pointer",
              }}
            >
              <Logo sx={{ width: 120, color: "primary" }} />
            </A>
          </Link>
          <IconButton
            sx={{ fontSize: 6 }}
            onClick={() => setMobileMenuIsOpen(false)}
          >
            <FiX size="24px" />
          </IconButton>
        </Container>
        <Container
          sx={{
            pt: 4,
            pb: 4,
            display: "flex",
            flexDirection: "column",
            height: `calc(100vh - ${navHeight})`,
          }}
        >
          <Flex sx={{ flexDirection: "column" }}>
            <Link href="/#contactSection" passHref>
              <Button as={A} variant="outline" sx={{ mb: 3 }}>
                Contact
              </Button>
            </Link>
            {!token && (
              <>
                <Link href="/login" passHref>
                  <Button as={A} variant="outline" sx={{ mb: 3 }}>
                    Login
                  </Button>
                </Link>
                <Link href="/register" passHref>
                  <Button as={A}>Sign up</Button>
                </Link>
              </>
            )}
          </Flex>
          <Flex
            sx={{
              py: 3,
              flexDirection: "column",
            }}
          >
            {token && (
              <>
                <Link href="/app/user" passHref>
                  <A
                    sx={{
                      py: 3,
                      mb: 0,
                      color: "text",
                      textDecoration: "none",
                    }}
                  >
                    My Account
                  </A>
                </Link>
              </>
            )}
            {user && user.admin && (
              <>
                <Link href="/app/admin" passHref>
                  <A variant="nav">Admin</A>
                </Link>
              </>
            )}
            <Link href="/docs" passHref>
              <A
                sx={{
                  color: "text",
                  textDecoration: "none",
                  py: 3,
                  mb: 0,
                  borderBottom: "1px solid #eaeaea",
                }}
              >
                Documentation
              </A>
            </Link>
            <Link href="/jobs" passHref>
              <A
                sx={{
                  color: "text",
                  textDecoration: "none",
                  py: 3,
                  mb: 0,
                }}
              >
                Jobs
              </A>
            </Link>
          </Flex>
        </Container>
      </Box>
    </>
  );
};
