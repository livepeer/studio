import {
  styled,
  Box,
  Flex,
  Text,
  Link as A,
  Avatar,
  Grid,
} from "@livepeer.com/design-system";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import ThemeSwitch from "../ThemeSwitch";
import Link from "next/link";
import { HomeIcon, StreamIcon, TerminalIcon, BillingIcon } from "./NavIcons";

const NavLink = styled(A, {
  textDecoration: "none",
  fontSize: "$3",
  display: "flex",
  alignItems: "center",
  color: "$hiContrast",
  "&:hover": {
    textDecoration: "none",
  },
  "&:focus": {
    outline: "none",
  },
});

const Sidebar = ({ id }) => {
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
        <Flex align="center" css={{ cursor: "pointer" }}>
          <Avatar size="3" alt="Paige" fallback="P" />
          <Text size="$3" css={{ ml: "$2", mr: "$1" }}>
            Paige
          </Text>
          <ChevronDownIcon width={20} height={20} />
        </Flex>
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
                WebkitBackgroundClip: "text",
                ml: "$2",
                lineHeight: 1.2,
              }}>
              Home
            </Text>
          </NavLink>
        </Link>
        <Link href="/dashboard/streams" passHref>
          <NavLink>
            <StreamIcon active={id === "streams"} />
            <Text
              gradient={id === "streams"}
              variant={id === "streams" ? "violet" : null}
              css={{
                fontWeight: id === "streams" ? 700 : 400,
                WebkitBackgroundClip: "text",
                ml: "$2",
                lineHeight: 1.2,
              }}>
              Streams
            </Text>
          </NavLink>
        </Link>
        <Link href="/dashboard/developers/api-keys" passHref>
          <NavLink>
            <TerminalIcon active={id === "developers"} />
            <Text
              gradient={id === "developers"}
              variant={id === "developers" ? "violet" : null}
              css={{
                fontWeight: id === "developers" ? 700 : 400,
                WebkitBackgroundClip: "text",
                ml: "$2",
                lineHeight: 1.2,
              }}>
              Developers
            </Text>
          </NavLink>
        </Link>
        <Link href="/dashboard/billing" passHref>
          <NavLink>
            <BillingIcon active={id === "billing"} />
            <Text
              gradient={id === "billing"}
              variant={id === "billing" ? "violet" : null}
              css={{
                display: "flex",
                fontWeight: id === "billing" ? 700 : 400,
                WebkitBackgroundClip: "text",
                ml: "$2",
                lineHeight: 1.2,
              }}>
              Billing
            </Text>
          </NavLink>
        </Link>
      </Grid>
    </Box>
  );
};

export default Sidebar;
