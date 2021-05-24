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
import HomeIcon from "../../../public/img/icons/home.svg";
import StreamIcon from "../../../public/img/icons/stream.svg";
import TerminalIcon from "../../../public/img/icons/terminal.svg";
import BillingIcon from "../../../public/img/icons/billing.svg";

const NavLink = styled(A, {
  textDecoration: "none",
  fontSize: "$3",
  display: "flex",
  alignItems: "center",
  "&:hover": {
    textDecoration: "none",
  },
  variants: {
    active: {
      true: {
        color: "$blue900",
        fontWeight: 700,
      },
    },
  },
});

const Sidebar = () => {
  return (
    <Box
      css={{
        borderRight: "1px solid",
        borderColor: "$slate500",
        zIndex: 10,
        width: 270,
        top: 0,
        position: "fixed",
        justifyContent: "flex-end",
        bottom: 0,
        backgroundColor: "$loContrast",
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
          <NavLink active css={{ textDecoration: "none" }}>
            <HomeIcon />
            <Box css={{ ml: "$1" }}>Home</Box>
          </NavLink>
        </Link>
        <Link href="/dashboard/streams" passHref>
          <NavLink css={{ textDecoration: "none" }}>
            <StreamIcon />
            <Box css={{ ml: "$1" }}>Streams</Box>
          </NavLink>
        </Link>
        <Link href="/dashboard/developers/api-keys" passHref>
          <NavLink css={{ textDecoration: "none" }}>
            <TerminalIcon />
            <Box css={{ ml: "$1" }}>Developers</Box>
          </NavLink>
        </Link>
        <Link href="/dashboard/billing" passHref>
          <NavLink css={{ textDecoration: "none" }}>
            <BillingIcon />
            <Box css={{ ml: "$1" }}>Billing</Box>
          </NavLink>
        </Link>
      </Grid>
    </Box>
  );
};

export default Sidebar;
