import {
  Box,
  Flex,
  Container,
  Button,
  Link as A,
} from "@livepeer.com/design-system";
import { FiX } from "react-icons/fi";
import { User } from "@livepeer.com/api";
import Link from "next/link";
import NavigationBreadcrumb, { BreadcrumbItem } from "../breadcrumb";

type Props = {
  links: any;
  breadcrumb?: BreadcrumbItem[];
  mobileMenuIsOpen: boolean;
  setMobileMenuIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  token: string | undefined;
  user: User | undefined;
};

const Menu = ({
  mobileMenuIsOpen,
  setMobileMenuIsOpen,
  token,
  user,
  links,
  breadcrumb,
}: Props) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setMobileMenuIsOpen(false);
  };

  return (
    <Box
      css={{
        backgroundColor: "$panel",
        position: "fixed",
        top: 0,
        height: mobileMenuIsOpen ? "100vh" : 0,
        transition: "height .2s",
        overflow: "hidden",
        width: "100%",
        zIndex: 1,
        visibility: mobileMenuIsOpen ? "visible" : "hidden",
      }}
      onClick={handleClick}>
      <Container
        css={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: "$3",
          backgroundColor: "$panel",
        }}>
        <Box css={{ display: "flex", alignItems: "center" }}>
          <NavigationBreadcrumb breadcrumb={breadcrumb} withLogoType={!token} />
        </Box>
        {/* <IconButton
          css={{ fontSize: 6 }}
          onClick={() => setMobileMenuIsOpen(false)}>
          <FiX size="24px" />
        </IconButton> */}
      </Container>
      <Container
        css={{
          pt: "$4",
          pb: "$4",
          display: "flex",
          flexDirection: "column",
          height: `calc(100vh -70px)`,
          backgroundColor: "$panel",
        }}>
        <Flex css={{ flexDirection: "column" }}>
          {links.map((link) => (
            <Link
              {...link}
              key={`menu-link-${link.href}`}
              variant="mobileNav"
            />
          ))}
          <Box as="hr" css={{ my: "$3", visibility: "hidden" }} />
          {!!token ? (
            <>
              <Link href="dashboard" passHref>
                <Button variant="violet">Dashboard</Button>
              </Link>
              {user && user.admin && (
                <Link href="/app/admin" passHref>
                  <A css={{ mt: "$3" }}>Admin</A>
                </Link>
              )}
            </>
          ) : (
            <>
              <Link href="/register" passHref>
                <A>Sign up</A>
              </Link>
              <Link href="/login" passHref>
                <Button css={{ mt: "$3" }} variant="violet">
                  Login
                </Button>
              </Link>
            </>
          )}
        </Flex>
      </Container>
    </Box>
  );
};

export default Menu;
