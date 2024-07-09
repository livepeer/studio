import {
  Link as A,
  Avatar,
  Box,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Flex,
  Grid,
  Text,
  styled,
} from "@livepeer/design-system";
import {
  BookmarkFilledIcon,
  BookmarkIcon,
  ChatBubbleIcon,
  ChevronDownIcon,
  LoopIcon,
  RocketIcon,
} from "@radix-ui/react-icons";
import { useJune } from "hooks/use-june";
import { isExport } from "lib/utils";
import Link from "next/link";
import Router, { useRouter } from "next/router";
import { useEffect } from "react";
import { useApi } from "../../hooks";
import ThemeSwitch from "../ThemeSwitch";
import {
  AssetsIcon,
  BillingIcon,
  HomeIcon,
  StreamIcon,
  TerminalIcon,
  UsageIcon,
} from "./NavIcons";

export const NavLink = styled(A, {
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  color: "$primary12",
  px: "$2",
  py: 6,
  borderRadius: "$2",
  cursor: "default",
  lineHeight: 1.2,
  fontWeight: 500,
  gap: "$2",
  textDecoration: "none",
  "&:hover": {
    bc: "$neutral4",
    textDecoration: "none",
  },
  "&:focus": {
    outline: "none",
  },
  variants: {
    active: { true: { bc: "$neutral4" } },
  },
});

export type SidebarId =
  | "home"
  | "streams"
  | "streams/sessions"
  // /stream-health - unhandled in the sidebar
  | "streams/health"
  | "assets"
  | "developers"
  | "developers/signing-keys"
  | "developers/webhooks"
  | "usage"
  | "billing"
  | "billing/plans";

const Sidebar = ({ id }: { id: SidebarId }) => {
  const { user, logout } = useApi();
  const router = useRouter();

  const June = useJune();

  useEffect(() => {
    if (typeof June !== "undefined") {
      const handleRouteChange = (url, { shallow }) => {
        console.log("Tracking URL:", url);
        June.track(url);
      };

      console.log("Adding event listener");
      router.events.on("routeChangeStart", handleRouteChange);

      return () => {
        console.log("Removing event listener");
        router.events.off("routeChangeStart", handleRouteChange);
      };
    }
  }, [June, router.events]);

  return (
    <Box
      css={{
        backgroundColor: "$panel",
        borderRight: "1px solid",
        borderColor: "$neutral6",
        maxWidth: 270,
        width: 270,
        top: 0,
        position: "fixed",
        justifyContent: "flex-end",
        bottom: 0,
      }}>
      <Flex align="center" justify="between" css={{ p: "$3", mb: "$3" }}>
        <DropdownMenu>
          <Flex
            as={DropdownMenuTrigger}
            align="center"
            css={{
              border: 0,
              background: "transparent",
              p: 0,
            }}>
            <Avatar
              placeholder="user"
              size="3"
              alt={user?.firstName}
              fallback={
                user?.firstName
                  ? user?.firstName?.charAt(0)
                  : user?.email.charAt(0)
              }
            />
            <Text
              size="3"
              css={{ ml: "$2", fontSize: "$3", mr: "$1" }}
              title={user?.email}>
              {user?.firstName}
            </Text>
            <Box
              as={ChevronDownIcon}
              css={{ width: 20, height: 20, color: "$hiContrast" }}
            />
          </Flex>
          <DropdownMenuContent
            placeholder="dropdown-menu-content"
            css={{ border: "1px solid $colors$neutral6" }}>
            <DropdownMenuGroup>
              <DropdownMenuItem
                key="billing-dropdown-item"
                onSelect={(e) => {
                  e.preventDefault();
                  Router.push("/billing");
                }}>
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem
                key="logout-dropdown-item"
                onSelect={(e) => {
                  e.preventDefault();
                  logout();
                }}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeSwitch />
      </Flex>
      <Flex
        css={{ px: "$4", height: "calc(100vh - 100px)" }}
        direction="column"
        justify="between">
        <Grid
          gap={1}
          css={{
            a: {
              textDecoration: "none",
            },
          }}>
          <Link href="/" passHref legacyBehavior>
            <NavLink active={id === "home"}>
              <HomeIcon active={id === "home"} />
              Home
            </NavLink>
          </Link>
          <Box>
            <Link href="/streams" passHref legacyBehavior>
              <NavLink active={id === "streams"}>
                <StreamIcon active={id === "streams"} />
                Streams
              </NavLink>
            </Link>

            {id?.split("/")[0] === "streams" && (
              <Box
                css={{
                  a: { pl: 35 },
                  "> :first-child": {
                    mt: "$1",
                  },
                }}>
                <Link href="/sessions" passHref legacyBehavior>
                  <NavLink active={id === "streams/sessions"}>Sessions</NavLink>
                </Link>
              </Box>
            )}
          </Box>
          <Link href="/assets" passHref legacyBehavior>
            <NavLink active={id === "assets"}>
              <AssetsIcon active={id === "assets"} />
              Assets
            </NavLink>
          </Link>
          <Box>
            <Link href="/developers/api-keys" passHref legacyBehavior>
              <NavLink>
                <TerminalIcon active={id?.split("/")[0] === "developers"} />
                Developers
              </NavLink>
            </Link>

            {id?.split("/")[0] === "developers" && (
              <Box
                css={{
                  a: {
                    pl: 35,
                    mt: "$1",
                  },
                }}>
                <Link href="/developers/api-keys" passHref legacyBehavior>
                  <NavLink active={id === "developers"}>API Keys</NavLink>
                </Link>
                <Link href="/developers/signing-keys" passHref legacyBehavior>
                  <NavLink active={id === "developers/signing-keys"}>
                    Signing Keys
                  </NavLink>
                </Link>
                <Link href="/developers/webhooks" passHref legacyBehavior>
                  <NavLink active={id === "developers/webhooks"}>
                    Webhooks
                  </NavLink>
                </Link>
              </Box>
            )}
          </Box>

          {!isExport() && (
            <Box>
              <Link href="/usage" passHref legacyBehavior>
                <NavLink active={id === "usage"}>
                  <UsageIcon active={id === "usage"} />
                  Usage
                </NavLink>
              </Link>
            </Box>
          )}

          {!isExport() && (
            <Box>
              <Link href="/billing" passHref legacyBehavior>
                <NavLink active={id === "billing"}>
                  <BillingIcon active={id === "billing"} />
                  Billing
                </NavLink>
              </Link>

              {id?.split("/")[0] === "billing" && (
                <Box
                  css={{
                    a: {
                      pl: 35,
                    },
                    "> :first-child": {
                      mt: "$1",
                    },
                  }}>
                  <Link href="/billing/plans" passHref legacyBehavior>
                    <NavLink active={id === "billing/plans"}>Plans</NavLink>
                  </Link>
                </Box>
              )}
            </Box>
          )}
        </Grid>
        {!isExport() && (
          <Flex direction="column" gap={1}>
            <NavLink
              href="https://docs.livepeer.org"
              target="_blank"
              css={{
                color: "$neutral10",
                transition: "color .3s",
                textDecoration: "none",
                "&:hover": {
                  color: "$neutral11",
                  transition: "color .3s",
                },
              }}>
              <BookmarkIcon />
              <Text
                css={{
                  display: "flex",
                  backgroundClip: "text",
                  ml: "$2",
                  lineHeight: 1.2,
                  fontSize: "$1",
                }}>
                Documentation
              </Text>
            </NavLink>

            <NavLink
              href="https://status.livepeer.studio/"
              target="_blank"
              css={{
                color: "$neutral10",
                transition: "color .3s",
                textDecoration: "none",
                "&:hover": {
                  color: "$neutral11",
                  transition: "color .3s",
                },
              }}>
              <LoopIcon />
              <Text
                css={{
                  display: "flex",
                  backgroundClip: "text",
                  ml: "$2",
                  lineHeight: 1.2,
                  fontSize: "$1",
                }}>
                Status
              </Text>
            </NavLink>

            <NavLink
              href="https://livepeer.canny.io/changelog?labels=studio"
              target="_blank"
              css={{
                color: "$neutral10",
                transition: "color .3s",
                textDecoration: "none",
                "&:hover": {
                  color: "$neutral11",
                  transition: "color .3s",
                },
              }}>
              <RocketIcon />
              <Text
                css={{
                  display: "flex",
                  backgroundClip: "text",
                  ml: "$2",
                  lineHeight: 1.2,
                  fontSize: "$1",
                }}>
                Changelog
              </Text>
            </NavLink>

            <NavLink
              href="https://livepeer.canny.io/feature-requests?category=studio&selectedCategory=studio"
              target="_blank"
              css={{
                color: "$neutral10",
                transition: "color .3s",
                textDecoration: "none",
                "&:hover": {
                  color: "$neutral11",
                  transition: "color .3s",
                },
              }}>
              <ChatBubbleIcon />
              <Text
                css={{
                  display: "flex",
                  backgroundClip: "text",
                  ml: "$2",
                  lineHeight: 1.2,
                  fontSize: "$1",
                }}>
                Feature Requests
              </Text>
            </NavLink>
          </Flex>
        )}
      </Flex>
    </Box>
  );
};

export default Sidebar;
