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
  variants: {
    active: {
      true: {
        color: "$violet900",
        fontWeight: 600,
      },
    },
  },
});

const Sidebar = ({ id }) => {
  return (
    <Box
      css={{
        borderRight: "1px solid",
        borderColor: "$slate500",
        zIndex: 10,
        maxWidth: 270,
        width: 270,
        top: 0,
        position: "fixed",
        justifyContent: "flex-end",
        bottom: 0,
        backgroundColor: "$slate100",
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
          <NavLink active={id === "home"} css={{ textDecoration: "none" }}>
            <HomeIcon active={id === "home"} />
            <Box css={{ ml: "$2" }}>Home</Box>
          </NavLink>
        </Link>
        <Link href="/dashboard/streams" passHref>
          <NavLink active={id === "streams"} css={{ textDecoration: "none" }}>
            <StreamIcon active={id === "streams"} />
            <Box css={{ ml: "$2" }}>Streams</Box>
          </NavLink>
        </Link>
        <Link href="/dashboard/developers/api-keys" passHref>
          <NavLink
            active={id === "developers"}
            css={{ textDecoration: "none" }}>
            <TerminalIcon active={id === "developers"} />
            <Box css={{ ml: "$2" }}>Developers</Box>
          </NavLink>
        </Link>
        <Link href="/dashboard/billing" passHref>
          <NavLink active={id === "billing"} css={{ textDecoration: "none" }}>
            <BillingIcon active={id === "billing"} />
            <Box css={{ ml: "$2" }}>Billing</Box>
          </NavLink>
        </Link>
      </Grid>
    </Box>
  );
};

export default Sidebar;
