import {
  Flex,
  Heading,
  Box,
  Button,
  Link as A,
  Text,
} from "@livepeer/design-system";
import { ArrowRightIcon, PlusIcon } from "@radix-ui/react-icons";
import { ToggleState } from "hooks/use-toggle-state";
import Link from "next/link";
import React from "react";

const EmptyState = ({
  createDialogState,
}: {
  createDialogState: ToggleState;
}) => {
  return (
    <Flex
      direction="column"
      justify="center"
      css={{
        margin: "0 auto",
        height: "calc(100vh - 400px)",
        maxWidth: 450,
      }}>
      <Heading css={{ fontWeight: 500, mb: "$3" }}>
        Create your first stream
      </Heading>
      <Text variant="gray" css={{ lineHeight: 1.5, mb: "$3" }}>
        Create a unique stream object, broadcast live video content and playback
        your live stream with Livepeer Studio.
      </Text>
      <Link href="https://docs.livepeer.studio/category/live" passHref>
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
          Create stream
        </Box>
      </Button>
    </Flex>
  );
};

export default EmptyState;
