import {
  Text,
  Flex,
  Heading,
  Box,
  Button,
  Link as A,
} from "@livepeer/design-system";
import { ArrowRightIcon, PlusIcon } from "@radix-ui/react-icons";
import { ToggleState } from "hooks/use-toggle-state";
import Link from "next/link";

const EmptyState = ({
  createDialogState,
}: {
  createDialogState: ToggleState;
}) => (
  <Flex
    direction="column"
    justify="center"
    css={{
      margin: "0 auto",
      height: "calc(100vh - 400px)",
      maxWidth: 450,
    }}>
    <Heading css={{ fontWeight: 500, mb: "$3" }}>Create a signing key</Heading>
    <Text variant="neutral" css={{ lineHeight: 1.5, mb: "$3" }}>
      Signing keys allow you to use playback policies with your streams to
      restrict access to them
    </Text>
    <Link
      href="https://docs.livepeer.studio/reference/api/create-signing-keys"
      passHref
      legacyBehavior>
      <A
        target="_blank"
        variant="primary"
        css={{ display: "flex", ai: "center", mb: "$5" }}>
        <Box>Learn more</Box>
        <ArrowRightIcon />
      </A>
    </Link>
    <Button
      onClick={() => createDialogState.onOn()}
      css={{ alignSelf: "flex-start" }}
      size="2"
      variant="primary">
      <PlusIcon />{" "}
      <Box as="span" css={{ ml: "$2" }}>
        Create a signing key
      </Box>
    </Button>
  </Flex>
);

export default EmptyState;
