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
} from "@livepeer/design-system";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import ThemeSwitch from "../ThemeSwitch";
import Link from "next/link";
import {
  HomeIcon,
  StreamIcon,
  TerminalIcon,
  BillingIcon,
  AssetsIcon,
} from "./NavIcons";
import { useApi } from "../../../hooks";
import Router from "next/router";
import { RocketIcon, ChatBubbleIcon } from "@radix-ui/react-icons";

const NavLink = styled(A, {
  fontSize: "$3",
  display: "flex",
  alignItems: "center",
  color: "$primary12",
  "&:hover": {
    textDecoration: "none",
  },
  "&:focus": {
    outline: "none",
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
  | "billing"
  | "billing/plans";

const Sidebar = ({ id }: { id: SidebarId }) => {
  const { user, logout } = useApi();

  return (
    <Box
      css={{
        backgroundColor: "$panel",
        borderRight: "1px solid",
        borderColor: "$neutral6",
        zIndex: 10,
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
              cursor: "pointer",
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
        <Grid css={{ a: { textDecoration: "none" } }} gap="3">
          <Link href="/dashboard" passHref legacyBehavior>
            <NavLink>
              <HomeIcon active={id === "home"} />
              <Text
                variant={id === "home" ? "blue" : null}
                css={{
                  fontWeight: id === "home" ? 700 : 400,
                  backgroundClip: "text",
                  ml: "$2",
                  lineHeight: 1.2,
                }}>
                Home
              </Text>
            </NavLink>
          </Link>
          <Box>
            <Link href="/dashboard/streams" passHref legacyBehavior>
              <NavLink>
                <StreamIcon active={id === "streams"} />
                <Text
                  variant={id === "streams" ? "blue" : null}
                  css={{
                    fontWeight: id === "streams" ? 700 : 400,
                    backgroundClip: "text",
                    ml: "$2",
                    lineHeight: 1.2,
                  }}>
                  Streams
                </Text>
              </NavLink>
            </Link>

            {id?.split("/")[0] === "streams" && (
              <Box
                css={{
                  "> :first-child": {
                    mt: "$1",
                  },
                }}>
                <Link href="/dashboard/sessions" passHref legacyBehavior>
                  <NavLink>
                    <Text
                      variant={id === "streams/sessions" ? "blue" : null}
                      css={{
                        fontWeight: id === "streams/sessions" ? 700 : 400,
                        backgroundClip: "text",
                        ml: 31,
                        mt: "$1",
                        lineHeight: 1.2,
                      }}>
                      Sessions
                    </Text>
                  </NavLink>
                </Link>
              </Box>
            )}
          </Box>

          <Link href="/dashboard/assets" passHref legacyBehavior>
            <NavLink>
              <AssetsIcon active={id === "assets"} />
              <Text
                variant={id === "assets" ? "blue" : null}
                css={{
                  fontWeight: id === "assets" ? 700 : 400,
                  backgroundClip: "text",
                  ml: "$2",
                  lineHeight: 1.2,
                }}>
                Assets
              </Text>
            </NavLink>
          </Link>

          <Box>
            <Link href="/dashboard/developers/api-keys" passHref legacyBehavior>
              <NavLink>
                <TerminalIcon active={id?.split("/")[0] === "developers"} />
                <Text
                  css={{
                    fontWeight: id?.split("/")[0] === "developers" ? 500 : 400,
                    backgroundClip: "text",
                    ml: "$2",
                    lineHeight: 1.2,
                  }}>
                  Developers
                </Text>
              </NavLink>
            </Link>

            {id?.split("/")[0] === "developers" && (
              <Box
                css={{
                  "> :first-child": {
                    mt: "$1",
                  },
                }}>
                <Link
                  href="/dashboard/developers/api-keys"
                  passHref
                  legacyBehavior>
                  <NavLink>
                    <Text
                      variant={id === "developers" ? "blue" : null}
                      css={{
                        fontWeight: id === "developers" ? 700 : 400,
                        backgroundClip: "text",
                        ml: 31,
                        mt: "$1",
                        mb: "$1",
                        lineHeight: 1.2,
                      }}>
                      API Keys
                    </Text>
                  </NavLink>
                </Link>
                <Link
                  href="/dashboard/developers/signing-keys"
                  passHref
                  legacyBehavior>
                  <NavLink>
                    <Text
                      variant={id === "developers/signing-keys" ? "blue" : null}
                      css={{
                        fontWeight:
                          id === "developers/signing-keys" ? 700 : 400,
                        backgroundClip: "text",
                        ml: 31,
                        mt: "$1",
                        mb: "$1",
                        lineHeight: 1.2,
                      }}>
                      Signing Keys
                    </Text>
                  </NavLink>
                </Link>
                <Link
                  href="/dashboard/developers/webhooks"
                  passHref
                  legacyBehavior>
                  <NavLink>
                    <Text
                      variant={id === "developers/webhooks" ? "blue" : null}
                      css={{
                        fontWeight: id === "developers/webhooks" ? 700 : 400,
                        backgroundClip: "text",
                        ml: 31,
                        mt: "$1",
                        mb: "$1",
                        lineHeight: 1.2,
                      }}>
                      Webhooks
                    </Text>
                  </NavLink>
                </Link>
              </Box>
            )}
          </Box>

          <Box>
            <Link href="/dashboard/billing" passHref legacyBehavior>
              <NavLink>
                <BillingIcon active={id === "billing"} />
                <Text
                  variant={id === "billing" ? "blue" : null}
                  css={{
                    display: "flex",
                    fontWeight: id === "billing" ? 700 : 400,
                    backgroundClip: "text",
                    WebkitTextFillColor: "initial",
                    ml: "$2",
                    lineHeight: 1.2,
                  }}>
                  Billing
                </Text>
              </NavLink>
            </Link>

            {id?.split("/")[0] === "billing" && (
              <Box
                css={{
                  "> :first-child": {
                    mt: "$1",
                  },
                }}>
                <Link href="/dashboard/billing/plans" passHref legacyBehavior>
                  <NavLink>
                    <Text
                      variant={id === "billing/plans" ? "blue" : null}
                      css={{
                        fontWeight: id === "billing/plans" ? 700 : 400,
                        backgroundClip: "text",
                        ml: 31,
                        mt: "$1",
                        lineHeight: 1.2,
                      }}>
                      Plans
                    </Text>
                  </NavLink>
                </Link>
              </Box>
            )}
          </Box>
        </Grid>
        <Box>
          <NavLink
            href="https://livepeer.canny.io/changelog?labels=studio"
            target="_blank"
            css={{
              color: "$neutral10",
              mb: "$3",
              transition: "color .3s",
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
        </Box>
      </Flex>
    </Box>
  );
};

export default Sidebar;
