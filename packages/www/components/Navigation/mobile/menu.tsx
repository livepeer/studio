import { Box, Flex, Container, IconButton } from "@theme-ui/components";
import Button from "../../Button";
import { FiX } from "react-icons/fi";
import { User } from "@livepeer.com/api";
import Link from "../../Link";
import NavigationBreadcrumb, { BreadcrumbItem } from "../breadcrumb";

type Props = {
  links: React.ComponentProps<typeof Link>[];
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
  breadcrumb
}: Props) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setMobileMenuIsOpen(false);
  };

  return (
    <Box
      sx={{
        bg: "rgba(0,0,0,.35)",
        position: "fixed",
        top: 0,
        height: mobileMenuIsOpen ? "100vh" : 0,
        transition: "height .2s",
        overflow: "hidden",
        width: "100%",
        zIndex: "dropdown",
        visibility: mobileMenuIsOpen ? "visible" : "hidden"
      }}
      onClick={handleClick}
    >
      <Container
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 3,
          bg: "background"
        }}
      >
        <div sx={{ display: "flex", alignItems: "center" }}>
          <NavigationBreadcrumb breadcrumb={breadcrumb} withLogoType={!token} />
        </div>
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
          height: `calc(100vh -70px)`,
          bg: "background"
        }}
      >
        <Flex sx={{ flexDirection: "column" }}>
          {links.map((link) => (
            <Link
              {...link}
              key={`menu-link-${link.href}`}
              variant="mobileNav"
            />
          ))}
          <hr sx={{ my: 3, visibility: "hidden" }} />
          {!!token ? (
            <>
              <Button href="/app/user" isLink>
                Dashboard
              </Button>
              {user && user.admin && (
                <Button
                  href="/app/admin"
                  variant="buttons.outline"
                  sx={{ mt: 3 }}
                  isLink
                >
                  Admin
                </Button>
              )}
            </>
          ) : (
            <>
              <Button href="/register" isLink>
                Sign up
              </Button>
              <Button
                href="/login"
                variant="buttons.outline"
                sx={{ mt: 3 }}
                isLink
              >
                Login
              </Button>
            </>
          )}
        </Flex>
      </Container>
    </Box>
  );
};

export default Menu;
