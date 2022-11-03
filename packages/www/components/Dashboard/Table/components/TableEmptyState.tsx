import {
  Flex,
  Heading,
  Box,
  Button,
  Text,
  Link as A,
} from "@livepeer/design-system";
import { ArrowRightIcon, PlusIcon } from "@radix-ui/react-icons";
import { ToggleState } from "hooks/use-toggle-state";
import Link from "next/link";

const TableEmptyState = ({
  title,
  description,
  learnMoreUrl,
  actionTitle,
  actionToggleState,
}: {
  title: string;
  description: string;
  learnMoreUrl: string;
  actionTitle?: string;
  actionToggleState?: ToggleState;
}) => (
  <Flex
    direction="column"
    justify="center"
    css={{
      margin: "0 auto",
      height: "calc(100vh - 400px)",
      maxWidth: 450,
    }}>
    <Heading css={{ fontWeight: 500, mb: "$3" }}>{title}</Heading>

    <Text variant="gray" css={{ lineHeight: 1.5, mb: "$3" }}>
      {description}
    </Text>

    <Link href={learnMoreUrl} passHref>
      <A
        target="_blank"
        variant="primary"
        css={{ display: "flex", ai: "center", mb: "$5" }}>
        <Box>Learn more</Box>
        <ArrowRightIcon />
      </A>
    </Link>

    {actionTitle !== undefined && (
      <Button
        onClick={actionToggleState.onOn}
        css={{ alignSelf: "flex-start" }}
        size="2"
        variant="primary">
        <PlusIcon />{" "}
        <Box as="span" css={{ ml: "$2" }}>
          {actionTitle}
        </Box>
      </Button>
    )}
  </Flex>
);

export default TableEmptyState;
