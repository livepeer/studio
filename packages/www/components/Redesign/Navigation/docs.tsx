import Button from "components/Redesign/Button";
import {
  Badge,
  Box,
  Flex,
  Text,
  Link as A,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@livepeer.com/design-system";
import Logo from "components/Redesign/Logo";
import { useApi } from "hooks";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { GoTriangleDown } from "react-icons/go";
import { useDocSearch } from "components/AlgoliaDocsSearch";
import ArrowLink from "components/Redesign/ArrowLink";

type DocsNavProps = {
  hideTopNav: boolean;
  setHideTopNav: React.Dispatch<React.SetStateAction<boolean>>;
  categories: { name: string; icon: JSX.Element; slug: string }[];
  mobileCategories: { name: string; icon: JSX.Element; slug: string }[];
};

const DocsNav = ({
  hideTopNav,
  setHideTopNav,
  categories,
  mobileCategories,
}: DocsNavProps) => {
  const { pathname } = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [closeSelect, setCloseSelect] = useState(false);
  const { token, logout } = useApi();
  const isDashboard = pathname.includes("/dashboard/");
  const router = useRouter();
  const currentPath = router.asPath
    .split("/")
    .slice(0, 3)
    .join("/")
    .split("#")[0];
  const [iconHover, setIconHover] = useState(false);

  useEffect(() => {
    if (token) {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  }, [token]);

  const handleClick = () => {
    setSelectOpen(!selectOpen);
    setCloseSelect(!closeSelect);
  };

  const { SearchModal, onSearchOpen, searchButtonRef } = useDocSearch();

  return (
    <>
      <Box
        onClick={() => setCloseSelect(false)}
        css={{
          display: "flex",
          height: "100vh",
          transition: "all 0.2s",
          zIndex: 1,
          width: "100vw",
          position: "fixed",
          bottom: 0,
          left: 0,
          backgroundColor: "$loContrast",
          visibility: selectOpen ? "visible" : "hidden",
          opacity: selectOpen ? "1" : "0",
          "@bp1": {
            display: "none",
          },
        }}
      />
      <Box
        css={{
          backgroundColor: "$loContrast",
          borderBottom: "1px solid $colors$mauve4",
          gridColumn: "1 / 16",
          position: "sticky",
          py: "$3",
          px: "$5",
          transition: "all 0.2s",
          transform: hideTopNav ? "translateY(-60px)" : "none",
          top: 0,
          zIndex: 100,
        }}>
        <Flex justify="between" align="center">
          <Flex align="center">
            <Flex align="center">
              <Logo />
            </Flex>
            <Box
              onClick={onSearchOpen}
              ref={searchButtonRef}
              css={{
                backgroundColor: "$panel",
                display: "none",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid $colors$mauve6",
                borderRadius: "8px",
                px: "$2",
                py: "8px",
                width: "215px",
                ml: "21px",
                cursor: "pointer",
                "@bp1": {
                  display: "flex",
                },
              }}>
              <Flex css={{ alignItems: "center" }}>
                <MagnifyingGlassIcon />
                <Text variant="gray" css={{ ml: "$2" }}>
                  Search
                </Text>
              </Flex>
              <Box
                css={{
                  border: "1px solid $colors$mauve7",
                  p: "$1",
                  borderRadius: "4px",
                }}>
                <Box css={{ fontSize: "10px" }}>⌘ K</Box>
              </Box>
            </Box>
          </Flex>

          <Flex align="center" justify="end">
            <Box
              css={{
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 24px",
                display: "none",
                "@bp1": {
                  display: "flex",
                },
              }}>
              <Flex align="center" justify="center">
                {categories.map((each, idx) => {
                  return (
                    <NextLink href={each?.slug} key={idx} passHref>
                      <A
                        css={{
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          mr: "$5",
                          textDecoration: "none",
                          color:
                            each?.slug === currentPath
                              ? "$hiContrast"
                              : "$mauve11",
                        }}>
                        {each.name}
                      </A>
                    </NextLink>
                  );
                })}
              </Flex>
            </Box>
            {!loggedIn && (
              <>
                <ArrowLink href="/login">Log in</ArrowLink>
                <Button arrow href="/register">
                  Sign up
                </Button>
              </>
            )}
            {loggedIn && (
              <>
                {!isDashboard && (
                  <Button arrow href="/dashboard">
                    Dashboard
                  </Button>
                )}
              </>
            )}
          </Flex>
        </Flex>

        <Box
          css={{
            display: "flex",
            mt: "$4",
            "@bp1": {
              display: "none",
            },
          }}>
          <DropdownMenu onOpenChange={handleClick}>
            <Box
              css={{
                width: "100%",
                display: "flex",
                "@bp1": {
                  display: "none",
                },
              }}>
              <DropdownMenuTrigger
                css={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  px: "24px",
                  justifyContent: "space-between",
                  ":focus": {
                    outline: "none",
                  },
                }}>
                <Box
                  css={{
                    display: "flex",
                    alignItems: "center",
                  }}>
                  <i>
                    {
                      mobileCategories.filter((a) => a.slug === currentPath)[0]
                        ?.icon
                    }
                  </i>
                  <Box
                    as="p"
                    css={{
                      fontSize: "14px",
                      fontWeight: 500,
                      ml: "12px",
                    }}>
                    {
                      mobileCategories.filter((a) => a.slug === currentPath)[0]
                        ?.name
                    }
                  </Box>
                </Box>
                <GoTriangleDown />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                css={{
                  width: "100vw",
                  alignSelf: "flex-start",
                  px: "24px",
                }}>
                {mobileCategories
                  ?.filter((a) => a.slug !== currentPath)
                  .map((each, idx) => (
                    <DropdownMenuItem
                      key={idx}
                      onSelect={() => {
                        router.push(each?.slug);
                      }}
                      css={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        pt: "24px",
                        ":last-child": {
                          pb: "24px",
                        },
                      }}>
                      <i>{each?.icon}</i>
                      <Box
                        as="p"
                        css={{
                          fontSize: "14px",
                          fontWeight: 500,
                          ml: "12px",
                          color: "$mauve9",
                        }}>
                        {each?.name}
                      </Box>
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </Box>
          </DropdownMenu>
        </Box>
      </Box>
      <SearchModal />
    </>
  );
};

export default DocsNav;
