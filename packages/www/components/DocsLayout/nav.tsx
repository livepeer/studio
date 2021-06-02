import { Flex } from "@theme-ui/components";
import { Button } from "@theme-ui/components";
import { IconButton } from "@theme-ui/components";
import { Box, Container, Link as A } from "@theme-ui/components";
import Logo from "components/Logo";
import NavigationBase from "components/Navigation/base";
import NavigationBreadcrumb from "components/Navigation/breadcrumb";
import { Tree } from "components/TableOfContents";
import { useApi } from "hooks";
import Link from "../Link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { BiSearch } from "react-icons/bi";
import {
  Download,
  IconApiReference,
  IconHouse,
  IconVideoGuides,
} from "./helpers";

type DocsNavProps = {
    hideTopNav: boolean
    setHideTopNav: React.Dispatch<React.SetStateAction<boolean>>
}

const DocsNav = ({hideTopNav, setHideTopNav}: DocsNavProps) => {
  const { pathname } = useRouter();
  const [menuMobile, setMenuMobile] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const { token, user, logout } = useApi();
  const isDashboard = pathname.includes("/app/");

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
        position: "sticky",
        paddingBottom: "24px",
        transition: "all 0.2s",
        transform: hideTopNav ? "translateY(-60px)" : "",
        top: 0,
        zIndex: 100,
      }}>
      <Container>
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
      </Container>
      <Container
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: "16px",
        }}>
        <Flex sx={{ justifyContent: "center", alignItems: "center" }}>
          <Flex sx={{ cursor: "pointer", alignItems: "center", mr: "32px" }}>
            <i>
              <IconHouse />
            </i>
            <p
              sx={{
                fontSize: "14px",
                fontWeight: "500",
                ml: "12px",
                color: "#828282",
              }}>
              Homepage
            </p>
          </Flex>
          <Flex sx={{ cursor: "pointer", alignItems: "center", mr: "32px" }}>
            <i>
              <IconVideoGuides />
            </i>
            <p
              sx={{
                fontSize: "14px",
                fontWeight: "500",
                ml: "12px",
                color: "#828282",
              }}>
              Video Guides
            </p>
          </Flex>
          <Flex sx={{ cursor: "pointer", alignItems: "center", mr: "32px" }}>
            <i>
              <IconApiReference />
            </i>
            <p
              sx={{
                fontSize: "14px",
                fontWeight: "500",
                ml: "12px",
                color: "#828282",
              }}>
              API Reference
            </p>
          </Flex>
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
      </Container>
    </Box>
  );
};

export default DocsNav;
