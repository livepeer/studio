import { Avatar, Box, useSnackbar } from "@livepeer/design-system";
import { NavLink } from "components/Nav/NavLink";
import CreateProjectDialog from "components/Project/createProjectDialog";
import { Flex } from "components/ui/flex";
import { Grid } from "components/ui/grid";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from "components/ui/select";
import { Text } from "components/ui/text";
import { useProjectContext } from "context/ProjectContext";
import { canSendEmail } from "lib/utils/can-send-email";
import {
  BadgeCheckIcon,
  BookmarkIcon,
  CheckIcon,
  ChevronDown,
  CircleGauge,
  CreditCardIcon,
  FolderKanbanIcon,
  HomeIcon,
  MessageCircleCodeIcon,
  PlaySquareIcon,
  SettingsIcon,
  SquarePenIcon,
  Star,
  Stars,
  TerminalIcon,
  VideoIcon,
} from "lucide-react";
import Link from "next/link";
import Router, { useRouter } from "next/router";
import { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { useApi } from "../../hooks";
import ThemeSwitch from "../ThemeSwitch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

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
  | "settings/plans"
  | "model-gallery"
  | "model-gallery/playground";

export const generalSidebarItems = [
  {
    title: "Home",
    path: "/",
    icon: <HomeIcon className="w-4 h-4 text-muted-foreground" />,
    id: "home",
  },

  {
    title: "Video",
    path: "/streams",
    icon: <PlaySquareIcon className="w-4 h-4 text-muted-foreground" />,
    id: "video",
    children: [
      {
        title: "Streams",
        path: "/streams",
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
        id: "assets",
      },
    ],
  },
  {
    title: "AI Models",
    path: "/model-gallery",
    icon: <Stars className="w-4 h-4 text-muted-foreground" />,
    id: "model-gallery",
  },
  {
    title: "Developers",
    path: "/developers/api-keys",
    icon: <TerminalIcon className="w-4 h-4 text-muted-foreground" />,
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
    icon: <SettingsIcon className="w-4 h-4 text-muted-foreground" />,
    id: "settings",
  },
];

const settingsSidebarItems = [
  {
    title: "Projects",
    path: "/settings/projects",
    id: "settings/projects",
    icon: <FolderKanbanIcon className="w-4 h-4 text-muted-foreground" />,
  },

  {
    title: "Usage",
    path: "/settings/usage",
    id: "settings/usage",
    icon: <CircleGauge className="w-4 h-4 text-muted-foreground" />,
  },
  {
    title: "Billing",
    path: "/settings/billing",
    id: "settings/billing",
    icon: <CreditCardIcon className="w-4 h-4 text-muted-foreground" />,
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
        `Please wait ${response.waitTime} seconds before sending another email.`
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
      <Flex className=" flex-col min-h-0  md:w-[270px] h-full p-2">
        <Flex className="p-1 mb-1 gap-2 flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center p-2 bg-transparent border-0 gap-2 hover:bg-accent data-[state=open]:bg-accent rounded-lg">
              <Avatar
                className="w-8 h-8"
                placeholder={user?.firstName || user?.email.charAt(0)}
                alt={user?.firstName}
                fallback={
                  user?.firstName
                    ? user?.firstName?.charAt(0)
                    : user?.email.charAt(0)
                }
              />
              <Text className="hidden md:block" weight="medium">
                {user?.firstName || user?.email || "My account"}
              </Text>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              placeholder="Account"
              className="w-[14rem] mt-1 ml-3">
              <DropdownMenuGroup className="flex flex-col mx-1">
                <DropdownMenuItem
                  className="px-2 py-1"
                  key="billing-dropdown-item"
                  onClick={(e) => {
                    Router.push("/settings/projects");
                  }}>
                  <Text size="sm">Projects</Text>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="px-2 py-1"
                  key="billing-dropdown-item"
                  onClick={() => {
                    Router.push("/settings/usage");
                  }}>
                  <Text size="sm">Usage</Text>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="px-2 py-1"
                  key="billing-dropdown-item"
                  onClick={() => {
                    Router.push("/settings/billing");
                  }}>
                  <Text size="sm">Billing</Text>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="px-2 py-1"
                  key="billing-dropdown-item"
                  onClick={() => {
                    Router.push("/settings/billing/plans");
                  }}>
                  <Text size="sm">Plans</Text>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="px-2 py-1"
                  key="changepassword-dropdown-item"
                  onClick={(e) => {
                    changePassword(e);
                  }}>
                  <Text size="sm">Change Password</Text>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="px-2 py-1"
                  key="logout-dropdown-item"
                  onClick={() => {
                    logout();
                  }}>
                  <Text size="sm">Log out</Text>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeSwitch />
        </Flex>

        {!isSettingsPage && (
          <DropdownMenu>
            <DropdownMenuTrigger className="ml-2 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1">
              {activeProject?.name}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="mt-1 w-[13rem]"
              placeholder={"Projects"}>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Projects</DropdownMenuLabel>

                {data?.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onSelect={() => {
                      setProjectId(project.id);
                    }}>
                    <Flex
                      className="w-full gap-2 justify-between items-center"
                      key={project.id}>
                      <Text size="sm">{project?.name}</Text>
                      {project.id === projectId && (
                        <CheckIcon className="w-4 h-4" />
                      )}
                    </Flex>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => {
                    setShowCreateProjectAlert(true);
                  }}>
                  <Flex>
                    <Text size="sm">Create new project</Text>
                  </Flex>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    Router.push("/settings/projects");
                  }}>
                  <Flex>
                    <Text size="sm">View all projects</Text>
                  </Flex>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Flex className="flex flex-1 flex-col gap-1 justify-between mt-4">
          <Grid className="gap-1">
            {(isSettingsPage ? settingsSidebarItems : generalSidebarItems).map(
              (item) => (
                <Box key={item.id}>
                  <Link
                    href={
                      isSettingsPage ? item.path : appendProjectId(item.path)
                    }
                    passHref
                    legacyBehavior>
                    <NavLink aria-selected={isActive(item)}>
                      {item.icon}
                      {item.title}
                    </NavLink>
                  </Link>
                  {item.children && isParentActive(item) && (
                    <Box>
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
                          <NavLink
                            aria-selected={isActive(child)}
                            isChild={true}>
                            {child.title}
                          </NavLink>
                        </Link>
                      ))}
                    </Box>
                  )}
                </Box>
              )
            )}
          </Grid>
          <Flex className="flex flex-col gap-1">
            <NavLink href="https://docs.livepeer.org" target="_blank">
              <BookmarkIcon className="w-4 h-4" />
              <Text size="sm">Documentation</Text>
            </NavLink>

            <NavLink href="https://status.livepeer.studio/" target="_blank">
              <BadgeCheckIcon className="w-4 h-4" />
              <Text size="sm">Status</Text>
            </NavLink>

            <NavLink
              href="https://livepeer.canny.io/changelog?labels=studio"
              target="_blank">
              <SquarePenIcon className="w-4 h-4" />
              <Text size="sm">Changelog</Text>
            </NavLink>

            <NavLink
              href="https://livepeer.canny.io/feature-requests?category=studio&selectedCategory=studio"
              target="_blank">
              <MessageCircleCodeIcon className="w-4 h-4" />
              <Text size="sm">Feature Requests</Text>
            </NavLink>
          </Flex>
        </Flex>
      </Flex>

      <CreateProjectDialog
        onCreate={onCreateClick}
        onOpenChange={(isOpen) => setShowCreateProjectAlert(isOpen)}
        isOpen={showCreateProjectAlert}
      />
    </>
  );
};

export default Sidebar;
