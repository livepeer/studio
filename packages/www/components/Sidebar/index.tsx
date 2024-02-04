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
  Heading,
  Button,
} from "@livepeer/design-system";

import ThemeSwitch from "../ThemeSwitch";
import Link from "next/link";
import {
  HomeIcon,
  StreamIcon,
  TerminalIcon,
  BillingIcon,
  UsageIcon,
  AssetsIcon,
  SettingsIcon,
  WorkspaceIcon,
  AccountIcon,
} from "./NavIcons";
import { useApi } from "../../hooks";
import Router, { useRouter } from "next/router";
import { RocketIcon, ChatBubbleIcon, LoopIcon } from "@radix-ui/react-icons";
import Contact from "../Contact";
import Image from "next/image";
import { workspaces } from "pages/dashboard/settings";
import { User } from "@livepeer.studio/api";
import { FiChevronLeft } from "react-icons/fi";

export const NavLink = styled(A, {
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  color: "$primary12",
  px: "$2",
  py: 8.5,
  borderRadius: "$1",
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
  // /dashboard/stream-health - unhandled in the sidebar
  | "streams/health"
  | "assets"
  | "developers"
  | "developers/signing-keys"
  | "developers/webhooks"
  | "usage"
  | "billing"
  | "billing/plans"
  | "settings"
  // Workspace settings
  | "workspace/general"
  | "workspace/projects"
  | "workspace/members"
  | "workspace/plans"
  | "workspace/billing"
  | "account/profile"
  | "account/preferences";

const Sidebar = ({ id }: { id: SidebarId }) => {
  const { user, logout } = useApi();

  const { pathname } = useRouter();

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
      {pathname.includes("workspace") ? (
        <WorkspaceSidebar id={id} user={user} />
      ) : (
        <GeneralSidebar id={id} user={user} />
      )}
    </Box>
  );
};

const GeneralSidebar = ({ id, user }: { id: SidebarId; user: User }) => {
  return (
    <>
      <Flex align="center" justify="between" css={{ p: "$3", mb: "$3" }}>
        <DropdownMenu>
          <Flex
            as={DropdownMenuTrigger}
            css={{
              alignItems: "center",
              backgroundColor: "transparent",
              border: 0,
              width: "70%",
              gap: "$2",
              cursor: "pointer",
              color: "$hiContrast",
              p: 8,
              ml: "$1",
              borderRadius: "$2",
              "&:hover": {
                background: "$neutral4",
              },
              "&:focus": {
                outline: "none",
              },
            }}>
            <Image
              src={workspaces[0].logo}
              alt="Project logo"
              style={{
                borderRadius: "6px",
              }}
              width={27}
              height={27}
            />
            <Text>{workspaces[0].name}</Text>
          </Flex>
          <DropdownMenuContent
            placeholder={workspaces[0].name}
            css={{
              border: "1px solid $colors$neutral6",
              p: "$3",
              width: "14rem",
              ml: "$5",
              mt: "$1",
            }}>
            <Text variant={"neutral"} css={{ mb: "$3" }}>
              {user?.email}
            </Text>
            <Box
              css={{
                pb: "$3",
                pl: "$3",
                borderBottom: "1px solid",
                borderColor: "$neutral6",
              }}>
              {workspaces.map((workspace) => (
                <Flex
                  direction={"row"}
                  css={{
                    gap: "$2",
                    width: "100%",
                  }}>
                  <Image
                    src={workspace.logo}
                    alt="Project logo"
                    style={{
                      borderRadius: "6px",
                    }}
                    width={22}
                    height={22}
                  />
                  <Text>{workspace.name}</Text>
                </Flex>
              ))}
            </Box>
            <Box
              css={{
                py: "$3",
                borderBottom: "1px solid",
                borderColor: "$neutral6",
                fontSize: 14,
                color: "$primary11",
                a: {
                  textDecoration: "none",
                  color: "$neutral12",
                },
              }}>
              <Flex
                direction={"column"}
                css={{
                  gap: "$3",
                  width: "100%",
                }}>
                <Link
                  href="/dashboard/workspace/general"
                  passHref
                  legacyBehavior>
                  Workspace settings
                </Link>
                <Link href="/" passHref legacyBehavior>
                  Invite & manage members
                </Link>
              </Flex>
            </Box>
            <Box
              css={{
                py: "$3",
                pb: 0,
                fontSize: 14,
                color: "$primary11",
                a: {
                  textDecoration: "none",
                  color: "$neutral12",
                },
              }}>
              <Flex
                direction={"column"}
                css={{
                  gap: "$3",
                  width: "100%",
                }}>
                <Link href="/" passHref legacyBehavior>
                  Create or join a workspace
                </Link>
                <Link href="/" passHref legacyBehavior>
                  Add an account
                </Link>
                <Link href="/" passHref legacyBehavior>
                  Log out
                </Link>
              </Flex>
            </Box>
          </DropdownMenuContent>
        </DropdownMenu>
        <Avatar
          size="3"
          alt={user?.firstName}
          css={{}}
          placeholder={user?.firstName ? user?.firstName.charAt(0) : "U"}
          fallback={
            user?.firstName ? user?.firstName?.charAt(0) : user?.email.charAt(0)
          }
        />
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

          <Box>
            <Link href="/dashboard/settings" passHref legacyBehavior>
              <NavLink active={id === "settings"}>
                <SettingsIcon active={id === "settings"} />
                Settings
              </NavLink>
            </Link>
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
    </>
  );
};

const WorkspaceSidebar = ({ id, user }: { id: SidebarId; user: User }) => {
  const goBack = () => {
    Router.push("/dashboard");
  };

  return (
    <>
      <Flex align="center" justify="between" css={{ p: "$3", mb: "$1" }}>
        <Button
          onClick={goBack}
          size={4}
          css={{
            ml: "-$2",
            gap: "$3",
            backgroundColor: "transparent",
            color: "$neutral12",
            fontWeight: 500,
            "&:hover": {
              backgroundColor: "transparent",
            },
          }}>
          <FiChevronLeft size={21} />
          Settings
        </Button>
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
          <Box>
            <NavLink active={id === "home"}>
              <WorkspaceIcon active={id === "home"} />
              Workspace
            </NavLink>
            <Box
              css={{
                a: {
                  pl: 35,
                  mt: "$1",
                },
              }}>
              <Link href="/dashboard/workspace/general" passHref legacyBehavior>
                <NavLink active={id === "workspace/general"}>General</NavLink>
              </Link>
              <Link
                href="/dashboard/workspace/projects"
                passHref
                legacyBehavior>
                <NavLink active={id === "workspace/projects"}>Projects</NavLink>
              </Link>
              <Link href="/dashboard/workspace/members" passHref legacyBehavior>
                <NavLink active={id === "workspace/members"}>Members</NavLink>
              </Link>
              <Link href="/dashboard/workspace/plans" passHref legacyBehavior>
                <NavLink active={id === "workspace/plans"}>Plans</NavLink>
              </Link>
              <Link href="/dashboard/workspace/billing" passHref legacyBehavior>
                <NavLink active={id === "workspace/billing"}>Billing</NavLink>
              </Link>
            </Box>
          </Box>
          <Box
            css={{
              mt: "$4",
            }}>
            <NavLink>
              <AccountIcon />
              Account
            </NavLink>
            <Box
              css={{
                a: {
                  pl: 35,
                  mt: "$1",
                },
              }}>
              <Link href="/dashboard/account/profile" passHref legacyBehavior>
                <NavLink active={id === "account/profile"}>Profile</NavLink>
              </Link>
              <Link
                href="/dashboard/account/preferences"
                passHref
                legacyBehavior>
                <NavLink active={id === "account/preferences"}>
                  Preferences
                </NavLink>
              </Link>
            </Box>
          </Box>
        </Grid>
      </Flex>
    </>
  );
};

export default Sidebar;
