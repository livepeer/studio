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
  useSnackbar,
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
  ProjectsIcon,
  UsageIcon,
  BillingIcon,
} from "./NavIcons";
import { canSendEmail } from "lib/utils/can-send-email";
import { useApi } from "../../hooks";
import Router, { useRouter } from "next/router";
import {
  RocketIcon,
  ChatBubbleIcon,
  LoopIcon,
  BookmarkIcon,
} from "@radix-ui/react-icons";
import { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import CreateProjectDialog from "components/Project/createProjectDialog";
import { FiCheck } from "react-icons/fi";
import { useProjectContext } from "context/ProjectContext";

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
    bc: "hsl(var(--accent))",
    textDecoration: "none",
  },
  "&:focus": {
    outline: "none",
  },
  variants: {
    active: { true: { bc: "hsl(var(--accent))" } },
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
    title: "Projects",
    path: "/settings/projects",
    id: "settings/projects",
    icon: <ProjectsIcon />,
  },

  {
    title: "Usage",
    path: "/settings/usage",
    id: "settings/usage",
    icon: <UsageIcon />,
  },
  {
    title: "Billing",
    path: "/settings/billing",
    id: "settings/billing",
    icon: <BillingIcon />,
    children: [
      {
        title: "Plans",
        path: "/settings/billing/plans",
        id: "settings/plans",
      },
    ],
  },
];

const Sidebar = ({ id }: { id: SidebarId }) => {
  const { setProjectId, projectId, appendProjectId } = useProjectContext();
  const { createProject, getProjects, logout, user, makePasswordResetToken } =
    useApi();
  const queryClient = useQueryClient();
  const { pathname } = useRouter();
  const [openSnackbar] = useSnackbar();

  const [showCreateProjectAlert, setShowCreateProjectAlert] = useState(false);

  const { data } = useQuery("projects", getProjects);
  const activeProject = data?.find((project) => project.id === projectId);

  const isSettingsPage = pathname.includes("/settings/");

  const onCreateClick = async (projectName: string) => {
    const project = await createProject({
      name: projectName,
    });

    setProjectId(project.id);
    setShowCreateProjectAlert(false);

    queryClient.invalidateQueries("projects");
  };

  const isResourcePage = () => {
    const path = window.location.pathname;

    const resourceKeywords = ["/streams/", "/assets/", "/developers/webhooks/"];

    for (const keyword of resourceKeywords) {
      if (path.includes(keyword)) {
        return keyword;
      }
    }

    return false;
  };

  const isActive = (item: any) => {
    if (id === item.id) {
      return true;
    }
    return false;
  };

  const isParentActive = (item: any) => {
    if (id === item.id) {
      return true;
    }
    if (item.children) {
      return item.children.some((child: any) => id === child.id);
    }
    return false;
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const response = canSendEmail("resetPassword");
    if (!response.canSend) {
      openSnackbar(
        `Please wait ${response.waitTime} seconds before sending another email.`,
      );
      return;
    }
    openSnackbar("Password reset link sent to your email.");
    const res = await makePasswordResetToken(user.email);
    if (res.errors) {
      openSnackbar(res?.errors?.[0]);
    }
  };

  return (
    <>
      <Box className="bg-background w-[17rem] fixed justify-end  bottom-0 top-0 z-0">
        <Flex align="center" justify="between" css={{ p: "$3", mb: "$3" }}>
          <DropdownMenu>
            <Flex
              as={DropdownMenuTrigger}
              className="hover:bg-accent"
              align="center"
              css={{
                border: 0,
                background: "transparent",
                p: 6,
                "&:hover": {
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
                css={{
                  ml: "$2",
                  fontSize: "$3",
                  mr: "$1",
                  color: "$neutral11",
                }}>
                My Account
              </Text>
            </Flex>
            <DropdownMenuContent
              className="bg-surface border"
              placeholder="Account"
              css={{
                width: "12rem",
                ml: "$4",
                mt: "$1",
              }}>
              <DropdownMenuGroup
                css={{
                  display: "flex",
                  flexDirection: "column",
                  mx: "$1",
                }}>
                <DropdownMenuItem
                  css={{
                    py: "$3",
                    px: "$2",
                    borderRadius: "$1",
                    "&:hover": {
                      transition: ".2s",
                      bc: "$neutral4",
                    },
                  }}
                  key="billing-dropdown-item"
                  onClick={(e) => {
                    Router.push("/settings/projects");
                  }}>
                  <Text size="2">Projects</Text>
                </DropdownMenuItem>
                <DropdownMenuItem
                  css={{
                    py: "$3",
                    px: "$2",
                    borderRadius: "$1",
                    "&:hover": {
                      transition: ".2s",
                      bc: "$neutral4",
                    },
                  }}
                  key="billing-dropdown-item"
                  onClick={() => {
                    Router.push("/settings/usage");
                  }}>
                  <Text size="2">Usage</Text>
                </DropdownMenuItem>

                <DropdownMenuItem
                  css={{
                    py: "$3",
                    px: "$2",
                    borderRadius: "$1",
                    "&:hover": {
                      transition: ".2s",
                      bc: "$neutral4",
                    },
                  }}
                  key="billing-dropdown-item"
                  onClick={() => {
                    Router.push("/settings/billing");
                  }}>
                  <Text size="2">Billing</Text>
                </DropdownMenuItem>

                <DropdownMenuItem
                  css={{
                    py: "$3",
                    px: "$2",
                    borderRadius: "$1",
                    "&:hover": {
                      transition: ".2s",
                      bc: "$neutral4",
                    },
                  }}
                  key="billing-dropdown-item"
                  onClick={() => {
                    Router.push("/settings/billing/plans");
                  }}>
                  <Text size="2">Plans</Text>
                </DropdownMenuItem>
                <DropdownMenuItem
                  css={{
                    py: "$3",
                    px: "$2",
                    borderRadius: "$1",
                    "&:hover": {
                      transition: ".2s",
                      bc: "$neutral4",
                    },
                  }}
                  key="changepassword-dropdown-item"
                  onClick={(e) => {
                    changePassword(e);
                  }}>
                  <Text size="2">Change Password</Text>
                </DropdownMenuItem>
                <DropdownMenuItem
                  css={{
                    py: "$3",
                    px: "$2",
                    borderRadius: "$1",
                    "&:hover": {
                      transition: ".2s",
                      bc: "$neutral4",
                    },
                  }}
                  key="logout-dropdown-item"
                  onClick={() => {
                    logout();
                  }}>
                  <Text size="2">Log out</Text>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeSwitch />
        </Flex>

        {!isSettingsPage && (
          <DropdownMenu>
            <Flex
              align={"center"}
              className="hover:bg-accent"
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
                  borderRadius: "$3",
                },
              }}>
              <Text
                css={{
                  color: "$neutral11",
                }}>
                {activeProject?.name}
              </Text>
              <TopBottomChevron />
            </Flex>
            <DropdownMenuContent
              className="bg-surface border"
              placeholder={"Projects"}
              css={{
                width: "13rem",
                ml: "$4",
                py: "$2",
                px: "$2",
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
                      py: "$3",
                      px: "$2",
                      cursor: "default",
                      "&:hover": {
                        backgroundColor: "$neutral4",
                        borderRadius: "$3",
                      },
                    }}
                    onClick={() => {
                      setProjectId(project.id);
                      if (isResourcePage()) {
                        const path = isResourcePage() as string;
                        const newUrl = `/dashboard/projects/${project.id}${path}`;
                        window.location.assign(newUrl);
                      }
                    }}>
                    <Flex
                      css={{ width: "100%" }}
                      key={project.id}
                      align={"center"}
                      justify={"between"}>
                      <Text size={2}>{project?.name}</Text>
                      {projectId === project.id && <FiCheck />}
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
                    onClick={() => setShowCreateProjectAlert(true)}
                    css={{
                      color: "$neutral12",
                      cursor: "default",
                      borderRadius: "$3",
                      py: "$3",
                      px: "$2",
                      "&:hover": {
                        backgroundColor: "$neutral4",
                      },
                    }}>
                    <Flex align={"center"}>
                      <Text size={2}>Create new project</Text>
                    </Flex>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => Router.push("/settings/projects")}
                    css={{
                      color: "$neutral12",
                      cursor: "default",
                      borderRadius: "$3",
                      py: "$3",
                      px: "$2",
                      "&:hover": {
                        backgroundColor: "$neutral4",
                      },
                    }}>
                    <Flex align={"center"}>
                      <Text size={2}>View all projects</Text>
                    </Flex>
                  </DropdownMenuItem>
                </Flex>
              </Box>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

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
            {(isSettingsPage ? settingsSidebarItems : generalSidebarItems).map(
              (item) => (
                <Box key={item.id}>
                  <Link
                    href={
                      isSettingsPage ? item.path : appendProjectId(item.path)
                    }
                    passHref
                    legacyBehavior>
                    <NavLink active={isActive(item)}>
                      {item.icon}
                      {item.title}
                    </NavLink>
                  </Link>
                  {item.children && isParentActive(item) && (
                    <Box
                      css={{
                        a: {
                          pl: 35,
                          mt: "$1",
                        },
                      }}>
                      {item.children.map((child) => (
                        <Link
                          href={
                            isSettingsPage
                              ? child.path
                              : appendProjectId(child.path)
                          }
                          key={child.id}
                          passHref
                          legacyBehavior>
                          <NavLink active={isActive(child)}>
                            {child.title}
                          </NavLink>
                        </Link>
                      ))}
                    </Box>
                  )}
                </Box>
              ),
            )}
          </Grid>
          <Flex
            direction="column"
            gap={1}
            css={{
              mb: !isSettingsPage ? "$6" : "$0",
            }}>
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
        </Flex>
      </Box>

      <CreateProjectDialog
        onCreate={onCreateClick}
        onOpenChange={(isOpen) => setShowCreateProjectAlert(isOpen)}
        isOpen={showCreateProjectAlert}
      />
    </>
  );
};

export default Sidebar;
