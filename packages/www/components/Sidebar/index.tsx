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
  Button,
} from "@livepeer/design-system";
import ThemeSwitch from "../ThemeSwitch";
import Link from "next/link";
import {
  HomeIcon,
  StreamIcon,
  TerminalIcon,
  AssetsIcon,
  TopBottomChevron,
  SettingsIcon,
  WorkspaceIcon,
} from "./NavIcons";
import { useApi } from "../../hooks";
import Router, { useRouter } from "next/router";
import { RocketIcon, ChatBubbleIcon, LoopIcon } from "@radix-ui/react-icons";
import Contact from "../Contact";
import { useJune, events } from "hooks/use-june";
import { useCallback, useEffect, useState } from "react";
import { isExport } from "lib/utils";
import { useQuery } from "react-query";
import CreateProjectDialog from "components/Project/createProjectDialog";
import { User } from "@livepeer.studio/api";
import useProject from "hooks/use-project";
import { FiCheck, FiChevronLeft } from "react-icons/fi";

export const NavLink = styled(A, {
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  color: "$primary12",
  px: "$2",
  py: 7,
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
  | "settings"
  | "settings/general"
  | "settings/projects"
  | "settings/usage"
  | "settings/billing"
  | "settings/plans";

export const generalSidebarItems = [
  {
    title: "Home",
    path: "/",
    icon: <HomeIcon />,
    id: "home",
  },
  {
    title: "Streams",
    path: "/streams",
    icon: <StreamIcon />,
    id: "streams",
    children: [
      {
        title: "Sessions",
        path: "/sessions",
        id: "streams/sessions",
      },
    ],
  },
  {
    title: "Assets",
    path: "/assets",
    icon: <AssetsIcon />,
    id: "assets",
  },
  {
    title: "Developers",
    path: "/developers/api-keys",
    icon: <TerminalIcon />,
    id: "developers",
    children: [
      {
        title: "API Keys",
        path: "/developers/api-keys",
        id: "developers",
      },
      {
        title: "Signing Keys",
        path: "/developers/signing-keys",
        id: "developers/signing-keys",
      },
      {
        title: "Webhooks",
        path: "/developers/webhooks",
        id: "developers/webhooks",
      },
    ],
  },
  {
    title: "Settings",
    path: "/settings",
    icon: <SettingsIcon />,
    id: "settings",
  },
];

const settingsSidebarItems = [
  {
    title: "Workspace",
    path: "#",
    icon: <WorkspaceIcon />,
    id: "settings/workspace",
    children: [
      {
        title: "Projects",
        path: "/settings/projects",
        id: "settings/projects",
      },
      {
        title: "Plans",
        path: "/settings/billing/plans",
        id: "settings/plans",
      },
      {
        title: "Usage",
        path: "/settings/usage",
        id: "settings/usage",
      },
      {
        title: "Billing",
        path: "/settings/billing",
        id: "settings/billing",
      },
    ],
  },
];

const Sidebar = ({ id }: { id: SidebarId }) => {
  const { user, logout } = useApi();
  const router = useRouter();

  const June = useJune();

  useEffect(() => {
    const handleRouteChange = (url, { shallow }) => {
      if (June) June.page(url);
    };

    router.events.on("routeChangeStart", handleRouteChange);

    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [June]);

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
      {pathname.includes("settings/") ? (
        <SettingsSidebar id={id} user={user} />
      ) : (
        <GeneralSidebar id={id} user={user} />
      )}
    </Box>
  );
};

const GeneralSidebar = ({ id, user }: { id: SidebarId; user: User }) => {
  const { createProject, getProjects, logout } = useApi();

  const [showCreateProjectAlert, setShowCreateProjectAlert] = useState(false);
  const { setCurrentProject, activeProjectId, appendProjectId } = useProject();

  const onCreateClick = async (projectName: string) => {
    const project = await createProject({
      name: projectName,
    });
  };

  const { data } = useQuery("projects", getProjects);

  const activeProject = data?.find((project) => project.id === activeProjectId);

  return (
    <>
      <CreateProjectDialog
        onCreate={onCreateClick}
        onOpenChange={(isOpen) => setShowCreateProjectAlert(isOpen)}
        isOpen={showCreateProjectAlert}
      />

      <Flex align="center" justify="between" css={{ p: "$3", mb: "$3" }}>
        <DropdownMenu>
          <Flex
            as={DropdownMenuTrigger}
            align="center"
            css={{
              border: 0,
              background: "transparent",
              p: 6,
              "&:hover": {
                backgroundColor: "$neutral4",
                borderRadius: "$3",
              },
            }}>
            <Avatar
              placeholder={user?.firstName || user?.email.charAt(0)}
              css={{
                width: 55,
                height: 55,
              }}
              alt={user?.firstName}
              fallback={
                user?.firstName
                  ? user?.firstName?.charAt(0)
                  : user?.email.charAt(0)
              }
            />
            <Text
              size="3"
              css={{ ml: "$2", fontSize: "$3", mr: "$1", color: "$neutral11" }}>
              My Account
            </Text>
          </Flex>
          <DropdownMenuContent
            placeholder="Account"
            css={{
              border: "1px solid $colors$neutral6",
              width: "12rem",
              ml: "$4",
            }}>
            <DropdownMenuGroup
              css={{
                display: "flex",
                flexDirection: "column",
                mx: "$1",
              }}>
              <DropdownMenuItem
                css={{
                  py: 3,
                  borderRadius: "$1",
                  "&:hover": {
                    transition: ".2s",
                    bc: "$neutral4",
                  },
                }}
                key="billing-dropdown-item"
                onSelect={(e) => {
                  e.preventDefault();
                  Router.push("/settings/projects");
                }}>
                <Text size="2">Projects</Text>
              </DropdownMenuItem>
              <DropdownMenuItem
                css={{
                  py: 3,
                  borderRadius: "$1",
                  "&:hover": {
                    transition: ".2s",
                    bc: "$neutral4",
                  },
                }}
                key="billing-dropdown-item"
                onSelect={(e) => {
                  e.preventDefault();
                  Router.push("/settings/billing/plans");
                }}>
                <Text size="2">Plans</Text>
              </DropdownMenuItem>
              <DropdownMenuItem
                css={{
                  py: 3,
                  borderRadius: "$1",
                  "&:hover": {
                    transition: ".2s",
                    bc: "$neutral4",
                  },
                }}
                key="billing-dropdown-item"
                onSelect={(e) => {
                  e.preventDefault();
                  Router.push("/settings/billing");
                }}>
                <Text size="2">Billing</Text>
              </DropdownMenuItem>
              <DropdownMenuItem
                css={{
                  py: 3,
                  borderRadius: "$1",
                  "&:hover": {
                    transition: ".2s",
                    bc: "$neutral4",
                  },
                }}
                key="billing-dropdown-item"
                onSelect={(e) => {
                  e.preventDefault();
                  Router.push("/settings/usage");
                }}>
                <Text size="2">Usage</Text>
              </DropdownMenuItem>
              <DropdownMenuItem
                css={{
                  py: 3,
                  borderRadius: "$1",
                  "&:hover": {
                    transition: ".2s",
                    bc: "$neutral4",
                  },
                }}
                key="logout-dropdown-item"
                onSelect={(e) => {
                  e.preventDefault();
                  logout();
                }}>
                <Text size="2">Logout</Text>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeSwitch />
      </Flex>

      <DropdownMenu>
        <Flex
          align={"center"}
          as={DropdownMenuTrigger}
          css={{
            py: "$1",
            px: "$2",
            gap: "$2",
            mb: "$2",
            mt: "-$1",
            ml: "$4",
            border: 0,
            backgroundColor: "transparent",
            "&:focus": {
              outline: "none",
            },
            "&:hover": {
              backgroundColor: "$neutral4",
              borderRadius: "$3",
            },
          }}>
          <Text
            css={{
              color: "$neutral11",
            }}>
            {activeProject?.name || "Untitled project"}
          </Text>
          <TopBottomChevron />
        </Flex>
        <DropdownMenuContent
          css={{
            border: "1px solid $colors$neutral6",
            p: "$3",
            width: "14rem",
            ml: "$5",
          }}>
          <Text size={2} variant={"neutral"} css={{ ml: "$1", mb: "$1" }}>
            Projects
          </Text>
          <Box
            css={{
              borderBottom: "1px solid",
              borderColor: "$neutral6",
              pb: "$2",
            }}>
            {data?.map((project) => (
              <DropdownMenuItem
                key={project.id}
                css={{
                  py: "$1",
                  px: "$2",
                  cursor: "default",
                  "&:hover": {
                    backgroundColor: "$neutral4",
                    borderRadius: "$3",
                  },
                }}>
                <Flex
                  onClick={() => {
                    setCurrentProject(project);
                  }}
                  css={{ width: "100%" }}
                  key={project.id}
                  align={"center"}
                  justify={"between"}>
                  <Text size={2}>{project.name || "Untitled project"}</Text>
                  {activeProjectId === project.id && <FiCheck />}
                </Flex>
              </DropdownMenuItem>
            ))}
          </Box>
          <Box
            css={{
              py: "$2",
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
                width: "100%",
              }}>
              <DropdownMenuItem
                css={{
                  color: "$neutral12",
                  cursor: "default",
                  borderRadius: "$3",
                  mb: "$1",
                  py: "$1",
                  px: "$2",
                  "&:hover": {
                    backgroundColor: "$neutral4",
                  },
                }}>
                <Flex
                  onClick={() => setShowCreateProjectAlert(true)}
                  align={"center"}>
                  <Text size={2}>Create new project</Text>
                </Flex>
              </DropdownMenuItem>
              <Flex
                onClick={() => Router.push("/settings/projects")}
                align={"center"}
                css={{
                  color: "$neutral12",
                  cursor: "default",
                  borderRadius: "$3",
                  px: "$2",
                  py: "$1",
                  "&:hover": {
                    backgroundColor: "$neutral4",
                  },
                }}>
                <Text size={2}>View all projects</Text>
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
              <Link href={appendProjectId(item.path)} passHref legacyBehavior>
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
                    <Link
                      href={appendProjectId(child.path)}
                      passHref
                      legacyBehavior>
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
          gap={1}
          css={{
            mb: "$7",
          }}>
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
                color: "$neutral10",
                transition: "color .3s",
                textDecoration: "none",
                "&:hover": {
                  color: "$neutral11",
                  transition: "color .3s",
                },
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

const SettingsSidebar = ({ id, user }: { id: SidebarId; user: User }) => {
  const { appendProjectId } = useProject();
  const goBack = () => {
    Router.push(appendProjectId("/"));
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
          {settingsSidebarItems.map((item, i) => (
            <Box key={`settings-sidebar-${i}`}>
              <Link href={item.path} passHref legacyBehavior>
                <NavLink active={id === item.id}>
                  {item.icon}
                  {item.title}
                </NavLink>
              </Link>

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
