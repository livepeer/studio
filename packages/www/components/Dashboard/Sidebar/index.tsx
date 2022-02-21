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
} from "@livepeer.com/design-system";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import ThemeSwitch from "../ThemeSwitch";
import Link from "next/link";
import { HomeIcon, StreamIcon, TerminalIcon, BillingIcon } from "./NavIcons";
import { useApi } from "../../../hooks";
import Router from "next/router";

const NavLink = styled(A, {
  textDecoration: "none",
  fontSize: "$3",
  display: "flex",
  alignItems: "center",
  color: "$mauve12",
  "&:hover": {
    textDecoration: "none",
  },
  "&:focus": {
    outline: "none",
  },
});

const Sidebar = ({ id }) => {
  const { user, logout } = useApi();

  return (
    <Box
      css={{
        backgroundColor: "$panel",
        borderRight: "1px solid",
        borderColor: "$mauve6",
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
            <Text size="3" css={{ ml: "$2", fontSize: "$3", mr: "$1" }}>
              {user?.firstName}
            </Text>
            <ChevronDownIcon width={20} height={20} />
          </Flex>
          <DropdownMenuContent css={{ border: "1px solid $colors$mauve6" }}>
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
      <Grid css={{ px: "$4" }} gap="3">
        <Link href="/dashboard" passHref>
          <NavLink>
            <HomeIcon active={id === "home"} />
            <Text
              gradient={id === "home"}
              variant={id === "home" ? "violet" : null}
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
          <Link href="/dashboard/streams" passHref>
            <NavLink>
              <StreamIcon active={id === "streams"} />
              <Text
                gradient={id === "streams"}
                variant={id === "streams" ? "violet" : null}
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
              <Link href="/dashboard/sessions" passHref>
                <NavLink>
                  <Text
                    gradient={id === "streams/sessions"}
                    variant={id === "streams/sessions" ? "violet" : null}
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

        <Box>
          <Link href="/dashboard/assets" passHref>
            <NavLink>
              <StreamIcon active={id?.split("/")[0] === "assets"} />
              <Text
                css={{
                  fontWeight: id?.split("/")[0] === "assets" ? 500 : 400,
                  backgroundClip: "text",
                  ml: "$2",
                  lineHeight: 1.2,
                }}>
                Assets
              </Text>
            </NavLink>
          </Link>

          {id?.split("/")[0] === "assets" && (
            <Box
              css={{
                "> :first-child": {
                  mt: "$1",
                },
              }}></Box>
          )}
        </Box>

        <Box>
          <Link href="/dashboard/developers/api-keys" passHref>
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
              <Link href="/dashboard/developers/api-keys" passHref>
                <NavLink>
                  <Text
                    gradient={id === "developers"}
                    variant={id === "developers" ? "violet" : null}
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
              <Link href="/dashboard/developers/webhooks" passHref>
                <NavLink>
                  <Text
                    gradient={id === "developers/webhooks"}
                    variant={id === "developers/webhooks" ? "violet" : null}
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

              <Link href="/dashboard/developers/media-server" passHref>
                <NavLink>
                  <Text
                    gradient={id === "developers/media-server"}
                    variant={id === "developers/media-server" ? "violet" : null}
                    css={{
                      fontWeight: id === "developers/media-server" ? 700 : 400,
                      backgroundClip: "text",
                      ml: 31,
                      mt: "$1",
                      lineHeight: 1.2,
                    }}>
                    Media Server
                  </Text>
                </NavLink>
              </Link>
            </Box>
          )}
        </Box>

        <Box>
          <Link href="/dashboard/billing" passHref>
            <NavLink>
              <BillingIcon active={id === "billing"} />
              <Text
                gradient={id === "billing"}
                variant={id === "billing" ? "violet" : null}
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
              <Link href="/dashboard/billing/plans" passHref>
                <NavLink>
                  <Text
                    gradient={id === "billing/plans"}
                    variant={id === "billing/plans" ? "violet" : null}
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
    </Box>
  );
};

export default Sidebar;
