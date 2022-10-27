import { Flex, Heading, Box, Text, Link as A } from "@livepeer/design-system";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import Link from "next/link";

const EmptyState = () => (
  <Flex
    direction="column"
    justify="center"
    css={{
      margin: "0 auto",
      height: "calc(100vh - 400px)",
      maxWidth: 450,
    }}>
    <Heading css={{ fontWeight: 500, mb: "$3" }}>No sessions</Heading>
    <Text variant="gray" css={{ lineHeight: 1.5, mb: "$3" }}>
      Stream sessions belong to parent streams.
    </Text>
    <Link
      href="https://docs.livepeer.studio/reference/api/get-session"
      passHref>
      <A
        target="_blank"
        variant="primary"
        css={{ display: "flex", ai: "center", mb: "$5" }}>
        <Box>Learn more</Box>
        <ArrowRightIcon />
      </A>
    </Link>
  </Flex>
);

export default EmptyState;
