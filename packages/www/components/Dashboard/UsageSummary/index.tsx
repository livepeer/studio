import {
  Box,
  Heading,
  Badge,
  Flex,
  Link as A,
  styled,
} from "@livepeer.com/design-system";
import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import UpcomingIcon from "../../../public/img/icons/upcoming.svg";

const StyledUpcomingIcon = styled(UpcomingIcon, {
  mr: "$2",
  color: "$hiContrast",
});

const UsageSummary = () => {
  return (
    <>
      <Flex
        justify="between"
        align="end"
        css={{
          borderBottom: "1px solid",
          borderColor: "$slate500",
          pb: "$4",
          mb: "$5",
          width: "100%",
        }}>
        <Heading size="2">
          <Flex>
            <Box
              css={{
                mr: "$3",
                fontWeight: 600,
                letterSpacing: "0",
              }}>
              Usage
            </Box>
            <Badge size="1" css={{ letterSpacing: 0, mt: "7px" }}>
              Personal Plan
            </Badge>
          </Flex>
        </Heading>
        <Box css={{ fontSize: "$3", color: "$gray800" }}>
          Current billing period (Apr 22 to May 22)
        </Box>
      </Flex>
      <Box
        css={{
          px: "$5",
          py: "$4",
          maxWidth: "33%",
          boxShadow: "0 0 0 1px $colors$slate500",
          borderRadius: "$1",
          backgroundColor: "$slate200",
          color: "$hiContrast",
          mb: "$6",
        }}>
        <Box css={{ mb: "$2", color: "$hiContrast" }}>Transcoding minutes</Box>
        <Flex align="center" css={{ fontSize: "$6" }}>
          <Box css={{ fontWeight: 700 }}>345</Box>
          <Box css={{ mx: "$1" }}>/</Box>
          <Box>1000</Box>
        </Flex>
      </Box>
      <Flex
        justify="between"
        align="center"
        css={{ fontSize: "$3", color: "$hiContrast" }}>
        <Flex align="center">
          <StyledUpcomingIcon />
          Upcoming invoice: <Box css={{ ml: "$1", fontWeight: 600 }}>$0.00</Box>
        </Flex>
        <Link href="/" passHref>
          <A variant="blue" css={{ display: "flex", alignItems: "center" }}>
            View billing <ArrowRightIcon />
          </A>
        </Link>
      </Flex>
    </>
  );
};

export default UsageSummary;
