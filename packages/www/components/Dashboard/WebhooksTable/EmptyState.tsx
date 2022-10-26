import { Text, Flex, Heading, Button, Box } from "@livepeer/design-system";
import { PlusIcon } from "@radix-ui/react-icons";
import { ToggleState } from "hooks/use-toggle-state";

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
    <Heading css={{ fontWeight: 500, mb: "$3" }}>
      Create your first webhook
    </Heading>
    <Text variant="gray" css={{ lineHeight: 1.5, mb: "$3" }}>
      Listen for events on your Livepeer Studio account so your integration can
      automatically trigger reactions.
    </Text>
    <Button
      onClick={() => createDialogState.onOn()}
      css={{ alignSelf: "flex-start" }}
      size="2"
      variant="primary">
      <PlusIcon />{" "}
      <Box as="span" css={{ ml: "$2" }}>
        Create webhook
      </Box>
    </Button>
  </Flex>
);

export default EmptyState;
