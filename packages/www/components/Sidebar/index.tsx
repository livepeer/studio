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
import ThemeSwitch from "../ThemeSwitch";
import { canSendEmail } from "lib/utils/can-send-email";
import { useApi } from "../../hooks";
import Router, { usePathname, useRouter } from "next/navigation";
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
import { Box } from "components/ui/box";
import { Text } from "components/ui/text";
import { Flex } from "components/ui/flex";
import { cn } from "lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "components/ui/dropdown-menu";
import { Grid } from "components/ui/grid";
import { Avatar, AvatarFallback } from "components/ui/avatar";
import { navigationOutlineVariants } from "components/ui/outline";

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
  const pathname = usePathname();

  const [showCreateProjectAlert, setShowCreateProjectAlert] = useState(false);

  const { data } = useQuery({ queryKey: ["projects"], queryFn: getProjects });
  const activeProject = data?.find((project) => project.id === projectId);

  const isSettingsPage = pathname.includes("/settings/");

  const onCreateClick = async (projectName: string) => {
    const project = await createProject({
      name: projectName,
    });

    setProjectId(project.id);
    setShowCreateProjectAlert(false);

    queryClient.invalidateQueries({ queryKey: ["projects"] });
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
      toast.warning(
        `Please wait ${response.waitTime} seconds before sending another email.`,
      );
      return;
    }
    toast("Password reset link sent to your email.");
    const res = await makePasswordResetToken(user.email);
    if (res.errors) {
      toast.error(res?.errors?.[0]);
    }
  };

  return (
    <>
      <Flex className="flex-col px-4 pt-2 pb-4 h-full lg:min-w-[250px]">
        <Flex>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Flex
                className={cn(
                  "items-center py-2 select-none cursor-pointer",
                  navigationOutlineVariants(),
                )}>
                <Avatar
                  className="w-10 h-10"
                  placeholder={user?.firstName || user?.email.charAt(0)}>
                  <AvatarFallback>
                    {user?.firstName
                      ? user?.firstName?.charAt(0)
                      : user?.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Text className="ml-2 font-semibold mr-1">My Account</Text>
              </Flex>
            </DropdownMenuTrigger>
            <DropdownMenuContent placeholder="Account">
              <DropdownMenuGroup className="mx-1">
                <Link href="/settings/projects">
                  <DropdownMenuItem>
                    <Text>Projects</Text>
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings/usage">
                  <DropdownMenuItem>
                    <Text>Usage</Text>
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings/billing">
                  <DropdownMenuItem>
                    <Text>Billing</Text>
                  </DropdownMenuItem>
                </Link>

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
                  <Text>Plans</Text>
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
                  <Text>Change Password</Text>
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
                  <Text>Log out</Text>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeSwitch />
        </Flex>

        {!isSettingsPage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Flex
                className="items-center gap-2 mb-2 mt-[-1px] "
                css={
                  {
                    // py: "$1",
                    // px: "$2",
                    // gap: "$2",
                    // mb: "$2",
                    // mt: "-$1",
                    // ml: "$4",
                    // border: 0,
                    // backgroundColor: "transparent",
                    // "&:focus": {
                    //   outline: "none",
                    // },
                    // "&:hover": {
                    //   backgroundColor: "$neutral4",
                    //   borderRadius: "$3",
                    // },
                  }
                }>
                <Text variant="neutral">{activeProject?.name}</Text>
                <TopBottomChevron />
              </Flex>
            </DropdownMenuTrigger>
            <DropdownMenuContent placeholder={"Projects"}>
              <Text variant={"neutral"} className="ml-1 mb-1">
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
                      className="w-full justify-between items-center"
                      key={project.id}>
                      <Text>{project?.name}</Text>
                      {projectId === project.id && <FiCheck />}
                    </Flex>
                  </DropdownMenuItem>
                ))}
              </Box>
              <Box className="py-2">
                <Flex className="flex-col w-full">
                  <DropdownMenuItem
                    onClick={() => setShowCreateProjectAlert(true)}>
                    <Flex className="justify-center">
                      <Text>Create new project</Text>
                    </Flex>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => Router.push("/settings/projects")}>
                    <Flex className="items-center">
                      <Text>View all projects</Text>
                    </Flex>
                  </DropdownMenuItem>
                </Flex>
              </Box>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Flex className="flex-1 flex-col justify-between">
          <Grid className="gap-1">
            {(isSettingsPage ? settingsSidebarItems : generalSidebarItems).map(
              (item) => (
                <Box key={item.id}>
                  <NavLink
                    href={
                      isSettingsPage ? item.path : appendProjectId(item.path)
                    }
                    active={isActive(item)}>
                    {item.icon}
                    {item.title}
                  </NavLink>

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
            className={cn("flex-col gap-1 mb-6", !isSettingsPage && "mb-0")}>
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
      </Flex>

      <CreateProjectDialog
        onCreate={onCreateClick}
        onOpenChange={(isOpen) => setShowCreateProjectAlert(isOpen)}
        isOpen={showCreateProjectAlert}
      />
    </>
  );
};

const NavLink = ({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
}) => {
  return (
    <Link
      className={cn("flex items-center gap-2", navigationOutlineVariants({}))}
      aria-selected={active}
      href={href}>
      {children}
    </Link>
  );
};

export default Sidebar;
