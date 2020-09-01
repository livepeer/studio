import {
  Box,
  Flex,
  Container,
  Link as A,
  IconButton
} from "@theme-ui/components";
import Button from "../Button";
import Link from "next/link";
import Logo from "../Logo";
import { FiX } from "react-icons/fi";

const Menu = ({ mobileMenuIsOpen, setMobileMenuIsOpen, token, user }) => (
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
      visibility: mobileMenuIsOpen ? "visible" : "hidden"
    }}
  >
    <Container
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: 3
      }}
    >
      <Logo logoType={!token} />
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
        height: `calc(100vh -70px)`
      }}
    >
      <Flex sx={{ flexDirection: "column" }}>
        {!token && (
          <>
            <Button
              href="/login"
              variant="buttons.outline"
              sx={{ mb: 3 }}
              isLink
            >
              Login
            </Button>
            <Button href="/register">Sign up</Button>
          </>
        )}
      </Flex>

      <Flex
        sx={{
          py: 3,
          flexDirection: "column"
        }}
      >
        {!!token && (
          <>
            <Link href="/app/user" passHref>
              <A
                sx={{
                  py: 3,
                  mb: 0,
                  color: "text",
                  textDecoration: "none"
                }}
              >
                Dashboard
              </A>
            </Link>
          </>
        )}
        {user && user.admin && (
          <Link href="/app/admin" passHref>
            <A variant="buttons.outline">Admin</A>
          </Link>
        )}
        <Link href="/docs" passHref>
          <A
            sx={{
              color: "text",
              textDecoration: "none",
              py: 3
            }}
          >
            Docs
          </A>
        </Link>
        <Link href="/blog" passHref>
          <A
            sx={{
              color: "text",
              textDecoration: "none",
              py: 3
            }}
          >
            Blog
          </A>
        </Link>
        <Link href="/contact" passHref>
          <A
            sx={{
              color: "text",
              textDecoration: "none",
              py: 3,
              mb: 0
            }}
          >
            Contact
          </A>
        </Link>
      </Flex>
    </Container>
  </Box>
);

export default Menu;
