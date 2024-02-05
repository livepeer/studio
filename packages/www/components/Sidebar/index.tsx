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
  DropdownMenuTrigger,
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
  TopBottomChevron,
} from "./NavIcons";
import { useApi } from "../../hooks";
import Router, { useRouter } from "next/router";
import {
  RocketIcon,
  ChatBubbleIcon,
  LoopIcon,
  PlusIcon,
  CheckIcon,
} from "@radix-ui/react-icons";
import Contact from "../Contact";
import Image from "next/image";
import { workspaces } from "pages/dashboard/settings";
import { User } from "@livepeer.studio/api";
import { FiCheck, FiChevronLeft } from "react-icons/fi";
import CreateProjectDialog from "components/Project/CreateProjectDialog";
import { useState } from "react";
import { FaCheck } from "react-icons/fa";

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
  | "streams/health"
  | "assets"
  | "developers"
  | "usage"
  | "billing"
  | "billing/plans"
  | "settings"
  | "workspace/general"
  | "workspace/projects"
  | "workspace/members"
  | "workspace/plans"
  | "workspace/billing"
  | "workspace/audit-log"
  | "account/profile"
  | "account/preferences"
  | "account/notifications";

export const generalSidebarItems = [
  {
    title: "Home",
    path: "/dashboard",
    icon: <HomeIcon />,
    id: "home",
  },
  {
    title: "Streams",
    path: "/dashboard/streams",
    icon: <StreamIcon />,
    id: "streams",
  },
  {
    title: "Assets",
    path: "/dashboard/assets",
    icon: <AssetsIcon />,
    id: "assets",
  },
  {
    title: "Developers",
    path: "/dashboard/developers",
    icon: <TerminalIcon />,
    id: "developers",
  },
  {
    title: "Usage",
    path: "/dashboard/usage",
    icon: <UsageIcon />,
    id: "usage",
  },
  {
    title: "Billing",
    path: "/dashboard/billing",
    icon: <BillingIcon />,
    id: "billing",
    children: [
      {
        title: "Plans",
        path: "/dashboard/billing/plans",
        id: "billing/plans",
      },
    ],
  },
  {
    title: "Settings",
    path: "/dashboard/settings",
    icon: <SettingsIcon />,
    id: "settings",
  },
];

const workspaceSidebarItems = [
  {
    title: "Workspace",
    path: "/dashboard/workspace/general",
    icon: <WorkspaceIcon />,
    id: "workspace/general",
    children: [
      {
        title: "General",
        path: "/dashboard/workspace/general",
        id: "workspace/general",
      },
      {
        title: "Projects",
        path: "/dashboard/workspace/projects",
        id: "workspace/projects",
      },
      {
        title: "Members",
        path: "/dashboard/workspace/members",
        id: "workspace/members",
      },
      {
        title: "Plans",
        path: "/dashboard/workspace/plans",
        id: "workspace/plans",
      },
      {
        title: "Billing",
        path: "/dashboard/workspace/billing",
        id: "workspace/billing",
      },
      {
        title: "Audit Log",
        path: "/dashboard/workspace/audit-log",
        id: "workspace/audit-log",
      },
    ],
  },
  {
    title: "Account",
    path: "/dashboard/account/profile",
    icon: <AccountIcon />,
    id: "account/profile",
    children: [
      {
        title: "Profile",
        path: "/dashboard/account/profile",
        id: "account/profile",
      },
      {
        title: "Preferences",
        path: "/dashboard/account/preferences",
        id: "account/preferences",
      },
      {
        title: "Notifications",
        path: "/dashboard/account/notifications",
        id: "account/notifications",
      },
    ],
  },
];

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
  const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false);

  return (
    <>
      <Flex align="center" justify="between" css={{ p: "$3", mb: "$1" }}>
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
      <DropdownMenu>
        <Flex
          align={"center"}
          as={DropdownMenuTrigger}
          css={{
            p: "$2",
            gap: "$2",
            mb: "$2",
            ml: "$3",
            width: "59%",
            borderRadius: "$3",
            border: 0,
            backgroundColor: "transparent",
            "&:focus": {
              outline: "none",
            },
            "&:hover": {
              backgroundColor: "$neutral4",
              cursor: "pointer",
            },
          }}>
          <Text
            css={{
              color: "$neutral11",
            }}>
            {workspaces[0].projects[0].name}
          </Text>
          <TopBottomChevron />
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
            Projects
          </Text>
          <Box
            css={{
              pl: "$3",
              borderBottom: "1px solid",
              borderColor: "$neutral6",
            }}>
            {workspaces[0].projects.map((project) => (
              <Flex
                css={{
                  mb: "$3",
                }}
                align={"center"}
                justify={"between"}>
                <Flex
                  direction={"row"}
                  css={{
                    gap: "$2",
                    width: "100%",
                  }}>
                  <Image
                    src={project.logo}
                    alt="Project logo"
                    style={{
                      borderRadius: "6px",
                    }}
                    width={22}
                    height={22}
                  />
                  <Text>{project.name}</Text>
                </Flex>
                {project.isDefault && <FiCheck />}
              </Flex>
            ))}
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
              <Flex
                onClick={() => setShowCreateProjectDialog(true)}
                align={"center"}
                css={{
                  color: "$neutral12",
                  gap: "$2",
                  cursor: "pointer",
                }}>
                <PlusIcon />
                New project
              </Flex>
            </Flex>
          </Box>
        </DropdownMenuContent>
      </DropdownMenu>
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
          {generalSidebarItems.map((item) => (
            <Box>
              <Link href={item.path} passHref legacyBehavior>
                <NavLink active={id === item.id}>
                  {item.icon}
                  {item.title}
                </NavLink>
              </Link>
              {item.children && id === item.id && (
                <Box
                  css={{
                    a: {
                      pl: 35,
                      mt: "$1",
                    },
                  }}>
                  {item.children.map((child) => (
                    <Link href={child.path} passHref legacyBehavior>
                      <NavLink active={id === child.id}>{child.title}</NavLink>
                    </Link>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Grid>
        <Flex
          direction="column"
          css={{
            mb: "60px",
          }}
          gap={1}>
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
      <CreateProjectDialog
        isOpen={showCreateProjectDialog}
        onOpenChange={setShowCreateProjectDialog}
        onCreate={async (projectName: string) => {
          console.log(projectName);
        }}
      />
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
          {workspaceSidebarItems.map((item) => (
            <Box
              css={{
                mb: "$5",
              }}>
              <NavLink>
                {item.icon}
                {item.title}
              </NavLink>
              {item.children && (
                <Box
                  css={{
                    a: {
                      pl: 35,
                      mt: "$1",
                    },
                  }}>
                  {item.children.map((child) => (
                    <Link href={child.path} passHref legacyBehavior>
                      <NavLink active={id === child.id}>{child.title}</NavLink>
                    </Link>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Grid>
      </Flex>
    </>
  );
};

export default Sidebar;
