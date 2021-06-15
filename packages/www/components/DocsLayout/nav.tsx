/** @jsx jsx */
import { jsx } from "theme-ui";
import { Flex } from "@theme-ui/components";
import Button from "components/Button";
import { Box, Link as A } from "@theme-ui/components";
import Logo from "components/Logo";
import { useApi } from "hooks";
import Link from "../Link";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { BiSearch } from "react-icons/bi";
import { GoTriangleDown } from "react-icons/go";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Download } from "./icons";
import { useDocSearch } from "components/AlgoliaDocsSearch";

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
  const isDashboard = pathname.includes("/app/");
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
      <div
        onClick={() => setCloseSelect(false)}
        sx={{
          display: ["flex", "none", "none"],
          height: "100vh",
          transition: "all 0.2s",
          zIndex: 1,
          width: "100vw",
          position: "fixed",
          bottom: 0,
          left: 0,
          background: "rgba(0, 0, 0, 0.32)",
          visibility: selectOpen ? "visible" : "hidden",
          opacity: selectOpen ? "1" : "0",
        }}
      />
      <Box
        sx={{
          borderBottom: "1px solid #E6E6E6",
          gridColumn: "1 / 16",
          position: "sticky",
          paddingBottom: "24px",
          transition: "all 0.2s",
          transform: hideTopNav ? "translateY(-60px)" : "",
          top: 0,
          background: "white",
          zIndex: 100,
        }}>
        <Box sx={{ padding: "0 24px" }}>
          <Flex
            sx={{
              py: 3,
              justifyContent: "space-between",
              alignItems: "center",
            }}>
            <div
              sx={{
                display: "flex",
                alignItems: "center",
              }}>
              <div sx={{ display: "flex", alignItems: "center" }}>
                <Logo logoType={false} withoutBeta />
                <span sx={{ fontSize: "16px", fontWeight: "600", mx: "12px" }}>
                  /
                </span>
                <p
                  sx={{
                    fontSize: "16px",
                    fontWeight: "600",
                    letterSpacing: "-0.06em",
                  }}>
                  docs
                </p>
              </div>
              <button
                onClick={onSearchOpen}
                ref={searchButtonRef}
                sx={{
                  display: ["none", "flex", "flex"],
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: "1px solid #E6E6E6",
                  borderRadius: "8px",
                  padding: "6px 6px 6px 10px",
                  width: "215px",
                  ml: "21px",
                  cursor: "pointer",
                }}>
                <Flex sx={{ alignItems: "center" }}>
                  <BiSearch size={14} />
                  <p sx={{ fontSize: "12px", color: "#525252", ml: "6px" }}>
                    Search
                  </p>
                </Flex>
                <div
                  sx={{
                    border: "1px solid #E6E6E6",
                    borderRadius: "4px",
                    padding: "4px",
                  }}>
                  <p sx={{ fontSize: "10px" }}>⌘ K</p>
                </div>
              </button>
            </div>
            <Flex
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
              }}>
              {!loggedIn && (
                <>
                  <Link
                    href="/login"
                    variant="nav"
                    sx={{ fontWeight: 600, mr: 0 }}>
                    Log in
                  </Link>
                  <Button
                    sx={{ py: "6px", ml: "20px" }}
                    variant="buttons.primarySmall"
                    href="/register"
                    isLink>
                    Sign up
                  </Button>
                </>
              )}
              {loggedIn && (
                <>
                  <A
                    variant="nav"
                    sx={{ mr: 3, cursor: "pointer" }}
                    onClick={() => logout()}>
                    Log Out
                  </A>
                  {!isDashboard && (
                    <Button
                      sx={{ py: "6px", ml: 3 }}
                      isLink
                      href="/app/user"
                      variant="buttons.primarySmall">
                      Dashboard
                    </Button>
                  )}
                </>
              )}
            </Flex>
          </Flex>
        </Box>
        <Box
          sx={{
            display: ["none", "flex", "flex"],
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 24px",
            mt: "16px",
          }}>
          <Flex
            sx={{
              justifyContent: "center",
              alignItems: "center",
            }}>
            {categories.map((each, idx) => {
              return (
                <NextLink href={each?.slug} key={idx} passHref>
                  <a
                    sx={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      mr: "32px",
                    }}>
                    <i>{each?.icon}</i>
                    <span
                      sx={{
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s",
                        textShadow:
                          each?.slug === currentPath
                            ? "0.4px 0 0 currentColor"
                            : "",
                        ml: "12px",
                        color: each?.slug === currentPath ? "black" : "#828282",
                      }}>
                      {each.name}
                    </span>
                  </a>
                </NextLink>
              );
            })}
          </Flex>
          <i
            onClick={() => setHideTopNav(!hideTopNav)}
            onMouseOver={() => setIconHover(true)}
            onMouseOut={() => setIconHover(false)}
            sx={{
              cursor: "pointer",
              transition: "all 0.2s",
              transform: hideTopNav ? "rotate(-180deg)" : "rotate(0deg)",
            }}>
            <Download hovered={iconHover} />
          </i>
        </Box>
        <Box
          sx={{
            display: ["flex", "none", "none"],
            mt: "8px",
          }}>
          <DropdownMenu.Root onOpenChange={handleClick}>
            <div
              sx={{
                width: "100%",
                display: ["flex", "none", "none"],
              }}>
              <DropdownMenu.Trigger
                sx={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  px: "24px",
                  justifyContent: "space-between",
                  ":focus": {
                    outline: "none",
                  },
                }}>
                <div
                  sx={{
                    display: "flex",
                    alignItems: "center",
                  }}>
                  <i>
                    {
                      mobileCategories.filter((a) => a.slug === currentPath)[0]
                        ?.icon
                    }
                  </i>
                  <p
                    sx={{
                      fontSize: "14px",
                      fontWeight: "500",
                      ml: "12px",
                    }}>
                    {
                      mobileCategories.filter((a) => a.slug === currentPath)[0]
                        ?.name
                    }
                  </p>
                </div>
                <GoTriangleDown />
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                sx={{
                  width: "100vw",
                  background: "white",
                  alignSelf: "flex-start",
                  px: "24px",
                }}>
                {mobileCategories
                  ?.filter((a) => a.slug !== currentPath)
                  .map((each, idx) => (
                    <DropdownMenu.Item
                      key={idx}
                      onSelect={() => {
                        router.push(each?.slug);
                      }}
                      sx={{
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
                      <p
                        sx={{
                          fontSize: "14px",
                          fontWeight: "500",
                          ml: "12px",
                          color: "#828282",
                        }}>
                        {each?.name}
                      </p>
                    </DropdownMenu.Item>
                  ))}
              </DropdownMenu.Content>
            </div>
          </DropdownMenu.Root>
        </Box>
      </Box>
      <SearchModal />
    </>
  );
};

export default DocsNav;
