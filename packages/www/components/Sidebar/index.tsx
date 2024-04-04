import {
  styled,
  Box,
  Flex,
  Text,
  Link as A,
  Avatar,
  Grid,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
  DropdownMenuItem,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
} from "@livepeer/design-system";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import ThemeSwitch from "../ThemeSwitch";
import Link from "next/link";
import {
  HomeIcon,
  StreamIcon,
  TerminalIcon,
  BillingIcon,
  UsageIcon,
  AssetsIcon,
} from "./NavIcons";
import { useApi } from "../../hooks";
import Router from "next/router";
import { RocketIcon, ChatBubbleIcon, LoopIcon } from "@radix-ui/react-icons";
import Contact from "../Contact";
import June from "lib/June";

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
  // /dashboard/stream-health - unhandled in the sidebar
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

  June.track(`sidebar ${id}`);

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
          <DropdownMenuContent css={{ border: "1px solid $colors$neutral6" }}>
            <DropdownMenuGroup>
              <DropdownMenuItem
                key="billing-dropdown-item"
                onSelect={(e) => {
                  e.preventDefault();
                  Router.push("/dashboard/billing");
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
          <Link href="/dashboard" passHref legacyBehavior>
            <NavLink active={id === "home"}>
              <HomeIcon active={id === "home"} />
              Home
            </NavLink>
          </Link>
          <Box>
            <Link href="/dashboard/streams" passHref legacyBehavior>
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
                <Link href="/dashboard/sessions" passHref legacyBehavior>
                  <NavLink active={id === "streams/sessions"}>Sessions</NavLink>
                </Link>
              </Box>
            )}
          </Box>
          <Link href="/dashboard/assets" passHref legacyBehavior>
            <NavLink active={id === "assets"}>
              <AssetsIcon active={id === "assets"} />
              Assets
            </NavLink>
          </Link>
          <Box>
            <Link href="/dashboard/developers/api-keys" passHref legacyBehavior>
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
                <Link
                  href="/dashboard/developers/api-keys"
                  passHref
                  legacyBehavior>
                  <NavLink active={id === "developers"}>API Keys</NavLink>
                </Link>
                <Link
                  href="/dashboard/developers/signing-keys"
                  passHref
                  legacyBehavior>
                  <NavLink active={id === "developers/signing-keys"}>
                    Signing Keys
                  </NavLink>
                </Link>
                <Link
                  href="/dashboard/developers/webhooks"
                  passHref
                  legacyBehavior>
                  <NavLink active={id === "developers/webhooks"}>
                    Webhooks
                  </NavLink>
                </Link>
              </Box>
            )}
          </Box>

          <Box>
            <Link href="/dashboard/usage" passHref legacyBehavior>
              <NavLink active={id === "usage"}>
                <UsageIcon active={id === "usage"} />
                Usage
              </NavLink>
            </Link>
          </Box>

          <Box>
            <Link href="/dashboard/billing" passHref legacyBehavior>
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
                <Link href="/dashboard/billing/plans" passHref legacyBehavior>
                  <NavLink active={id === "billing/plans"}>Plans</NavLink>
                </Link>
              </Box>
            )}
          </Box>
        </Grid>
        <Flex direction="column" gap={1}>
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
          <Contact />
        </Flex>
      </Flex>
    </Box>
  );
};

export default Sidebar;
