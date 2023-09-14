import {
  Box,
  Flex,
  Container,
  Link as A,
  Button as StyledButton,
} from "@livepeer/design-system";
import { User } from "@livepeer.studio/api";
import Link from "next/link";
import { BreadcrumbItem } from "../breadcrumb";
import { useEffect, useState } from "react";
import AuthButtons from "./authButtons";

const Menu = ({
  mobileMenuIsOpen,
  setMobileMenuIsOpen,
  token,
  user,
  links,
}: {
  links: any;
  breadcrumb?: BreadcrumbItem[];
  mobileMenuIsOpen: boolean;
  setMobileMenuIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  token: string | undefined;
  user: User | undefined;
}) => {
  const [authButtons, setAuthButtons] = useState<React.ReactNode>();

  useEffect(() => {
    setAuthButtons(
      <AuthButtons
        isTokenDefined={!!token}
        isAdminUser={user && user.admin}
        setMobileMenuIsOpen={setMobileMenuIsOpen}
      />
    );
  }, [token, user, setMobileMenuIsOpen]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setMobileMenuIsOpen(false);
  };

  return (
    <Box
      css={{
        position: "fixed",
        top: "$3",
        left: "$3",
        height: mobileMenuIsOpen ? "auto" : 0,
        transition: "height .2s",
        borderRadius: "$3",
        overflow: "hidden",
        width: "calc(100% - $space$3 * 2)",
        zIndex: 2,
        visibility: mobileMenuIsOpen ? "visible" : "hidden",
        background: mobileMenuIsOpen
          ? "linear-gradient(90deg,$colors$neutral4,$colors$neutral4 50%,transparent 0,transparent)"
          : "transparent",
        boxShadow: mobileMenuIsOpen
          ? "0px 2px 1px rgba(0, 0, 0, 0.04), 0px 16px 40px rgba(0, 0, 0, 0.14)"
          : "none",
      }}
      onClick={handleClick}>
      <StyledButton
        ghost
        css={{
          top: "$3",
          position: "absolute",
          right: "$2",
          cursor: "pointer",
          textTransform: "uppercase",
          color: "$hiContrast",
          fontSize: "$4",
          fontWeight: 500,
        }}
        onClick={() => setMobileMenuIsOpen(false)}>
        Close
      </StyledButton>
      <Container
        css={{
          pt: "$6",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "$panel",
          height: "100vh",
        }}>
        <Flex css={{ flexDirection: "column" }}>
          {links.map((link) => {
            return (
              <Link
                href={link.href}
                key={`menu-link-${link.href}`}
                passHref
                legacyBehavior>
                <A
                  onClick={() => setMobileMenuIsOpen(false)}
                  css={{
                    mb: "$4",
                    fontSize: "$8",
                    textDecoration: "none",
                    display: link.children ? "none" : "block",
                    "&:last-of-type": {
                      mb: 0,
                    },
                  }}>
                  {link.label}
                </A>
              </Link>
            );
          })}
        </Flex>
        <Flex
          css={{
            ai: "center",
          }}>
          {authButtons}
        </Flex>
      </Container>
    </Box>
  );
};

export default Menu;
