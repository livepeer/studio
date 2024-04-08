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
import { ChevronDownIcon, PlusIcon } from "@radix-ui/react-icons";
import ThemeSwitch from "../ThemeSwitch";
import Link from "next/link";
import {
  HomeIcon,
  StreamIcon,
  TerminalIcon,
  BillingIcon,
  UsageIcon,
  AssetsIcon,
  TopBottomChevron,
  SettingsIcon,
} from "./NavIcons";
import { useApi } from "../../hooks";
import Router, { useRouter } from "next/router";
import { RocketIcon, ChatBubbleIcon, LoopIcon } from "@radix-ui/react-icons";
import Contact from "../Contact";
import CreateProjectDialog from "components/Project/createProjectDialog";
import { useQueries, useQuery } from "react-query";
import { useState } from "react";
import { FiCheck, FiChevronLeft } from "react-icons/fi";
import useProject from "hooks/use-project";
import { User } from "@livepeer.studio/api";

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
  | "streams/health"
  | "assets"
  | "developers"
  | "developers/signing-keys"
  | "developers/webhooks"
  | "settings/general"
  | "settings/projects"
  | "settings/usage"
  | "settings/billing"
  | "settings/plans";

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
    children: [
      {
        title: "Sessions",
        path: "/dashboard/sessions",
        id: "streams/sessions",
      },
    ],
  },
  {
    title: "Assets",
    path: "/dashboard/assets",
    icon: <AssetsIcon />,
    id: "assets",
  },
  {
    title: "Developers",
    path: "/dashboard/developers/api-keys",
    icon: <TerminalIcon />,
    id: "developers",
    children: [
      {
        title: "API Keys",
        path: "/dashboard/developers/api-keys",
        id: "developers",
      },
      {
        title: "Signing Keys",
        path: "/dashboard/developers/signing-keys",
        id: "developers/signing-keys",
      },
      {
        title: "Webhooks",
        path: "/dashboard/developers/webhooks",
        id: "developers/webhooks",
      },
    ],
  },
  {
    title: "Settings",
    path: "/dashboard/settings/general",
    icon: <SettingsIcon />,
    id: "settings",
  },
];

const settingsSidebarItems = [
  {
    title: "Settings",
    path: "/dashboard/workspace/general",
    icon: <SettingsIcon />,
    id: "settings/general",
    children: [
      {
        title: "General",
        path: "/dashboard/settings/general",
        id: "settings/general",
      },
      {
        title: "Projects",
        path: "/dashboard/settings/projects",
        id: "settings/projects",
      },
      {
        title: "Usage",
        path: "/dashboard/settings/usage",
        id: "settings/usage",
      },
      {
        title: "Billing",
        path: "/dashboard/settings/billing",
        id: "settings/billing",
      },
      {
        title: "Plans",
        path: "/dashboard/settings/billing/plans",
        id: "settings/plans",
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
      {pathname.includes("settings") ? (
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
  const { setCurrentProject, currentProject } = useProject();

  const goBack = () => {
    Router.push("/dashboard");
  };

  const onCreateClick = async (projectName: string) => {
    const project = await createProject({
      name: projectName,
    });
  };

  const { data } = useQuery("projects", getProjects);

  const activeProject = data?.find((project) => project.id === currentProject);

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

      <DropdownMenu>
        <Flex
          align={"center"}
          as={DropdownMenuTrigger}
          css={{
            p: "$2",
            gap: "$3",
            mb: "$2",
            ml: "$3",
            border: 0,
            backgroundColor: "transparent",
            "&:focus": {
              outline: "none",
            },
            "&:hover": {
              backgroundColor: "$neutral4",
              borderRadius: "$3",
              cursor: "pointer",
            },
          }}>
          <Text
            css={{
              color: "$neutral11",
            }}>
            {activeProject?.name || "Untitled"}
          </Text>
          <TopBottomChevron />
        </Flex>
        <DropdownMenuContent
          placeholder={"test"}
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
              borderBottom: "1px solid",
              borderColor: "$neutral6",
            }}>
            {data?.map((project) => (
              <Flex
                onClick={() => setCurrentProject(project)}
                key={project.id}
                css={{
                  p: "$2",
                  "&:hover": {
                    backgroundColor: "$neutral4",
                    borderRadius: "$3",
                  },
                }}
                align={"center"}
                justify={"between"}>
                <Text>{project.name || "Untitled"}</Text>
                {currentProject === project.id && <FiCheck />}
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
                onClick={() => setShowCreateProjectAlert(true)}
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

const SettingsSidebar = ({ id, user }: { id: SidebarId; user: User }) => {
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
          {settingsSidebarItems.map((item) => (
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
