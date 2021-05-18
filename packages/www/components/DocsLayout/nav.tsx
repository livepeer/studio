import { Flex } from "@theme-ui/components";
import { Button } from "@theme-ui/components";
import { Box, Link as A } from "@theme-ui/components";
import Logo from "components/Logo";
import { useApi } from "hooks";
import Link from "../Link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { BiSearch } from "react-icons/bi";
import { GoTriangleDown } from "react-icons/go";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Download } from "./icons";

type DocsNavProps = {
  hideTopNav: boolean;
  setHideTopNav: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentCategory: React.Dispatch<
    React.SetStateAction<{
      name: string;
      icon: JSX.Element;
    }>
  >;
  currentCategory: { name: string; icon: JSX.Element; slug: string };
  categories: { name: string; icon: JSX.Element; slug: string }[];
  mobileCategories: { name: string; icon: JSX.Element; slug: string }[];
};

const DocsNav = ({
  hideTopNav,
  setHideTopNav,
  currentCategory,
  setCurrentCategory,
  categories,
  mobileCategories,
}: DocsNavProps) => {
  const { pathname } = useRouter();
  const [menuMobile, setMenuMobile] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const { token, user, logout } = useApi();
  const isDashboard = pathname.includes("/app/");
  const router = useRouter();

  useEffect(() => {
    if (token) {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  }, [token]);

  return (
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
            <div
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
            </div>
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
                  sx={{ fontWeight: 600, mr: 3 }}>
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
          {categories.map((each, idx) => (
            <div
              onClick={() => {
                setCurrentCategory(each);
                router.push(each.slug);
              }}
              sx={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                mr: "32px",
              }}>
              <i>{each.icon}</i>
              <span
                sx={{
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s",
                  textShadow:
                    each.name === currentCategory.name
                      ? "0.4px 0 0 currentColor"
                      : "",
                  ml: "12px",
                  color:
                    each.name === currentCategory.name ? "black" : "#828282",
                }}>
                {each.name}
              </span>
            </div>
          ))}
        </Flex>
        <i
          onClick={() => setHideTopNav(!hideTopNav)}
          sx={{
            cursor: "pointer",
            transition: "all 0.2s",
            transform: hideTopNav ? "rotate(-180deg)" : "rotate(0deg)",
          }}>
          <Download />
        </i>
      </Box>
      <Box
        sx={{
          display: ["flex", "none", "none"],
          padding: "0 24px",
          mt: "8px",
        }}>
        <DropdownMenu.Root>
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
                justifyContent: "space-between",
              }}>
              <div
                sx={{
                  display: "flex",
                  alignItems: "center",
                }}>
                <i>{currentCategory.icon}</i>
                <p
                  sx={{
                    fontSize: "14px",
                    fontWeight: "500",
                    ml: "12px",
                  }}>
                  {currentCategory.name}
                </p>
              </div>
              <GoTriangleDown />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              sx={{
                width: "100vw",
                background: "white",
                px: "24px",
                alignSelf: "flex-start",
              }}>
              {mobileCategories
                ?.filter((a) => a.name !== currentCategory.name)
                .map((each, idx) => (
                  <DropdownMenu.Item
                    key={idx}
                    onSelect={() => {
                      setCurrentCategory(each);
                      router.push(each.slug);
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
                    <i>{each.icon}</i>
                    <p
                      sx={{
                        fontSize: "14px",
                        fontWeight: "500",
                        ml: "12px",
                        color: "#828282",
                      }}>
                      {each.name}
                    </p>
                  </DropdownMenu.Item>
                ))}
            </DropdownMenu.Content>
          </div>
        </DropdownMenu.Root>
      </Box>
    </Box>
  );
};

export default DocsNav;
