import {
  Text,
  Box,
  Flex,
  Heading,
  Button,
  styled,
  Tooltip,
  Code,
} from "@livepeer/design-system";
import { useToggleState } from "hooks/use-toggle-state";
import { useState, useCallback } from "react";
import { useQueryClient } from "react-query";
import { Action } from "../StreamDetails/MultistreamTargetsTable/SaveTargetDialog";
import CreateEditDialog from "../WebhookDialogs/CreateEditDialog";
import { Cross1Icon, Pencil1Icon } from "@radix-ui/react-icons";
import { useApi } from "hooks";
import DeleteDialog from "../WebhookDialogs/DeleteDialog";
import DetailsBox from "./DetailsBox";

const StyledPencil = styled(Pencil1Icon, {
  mr: "$1",
  width: 12,
  height: 12,
});

const StyledCross = styled(Cross1Icon, {
  mr: "$1",
  width: 12,
  height: 12,
});

const WebhookDetails = ({ id, data }) => {
  const { deleteWebhook, updateWebhook } = useApi();
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const dialogState = useToggleState();
  const queryClient = useQueryClient();

  const invalidateQuery = useCallback(() => {
    return queryClient.invalidateQueries(id);
  }, [queryClient, id]);

  if (!data) return null;

  return (
    <Box css={{ p: "$6", mb: "$8" }}>
      <Box
        css={{
          borderRadius: 6,
        }}>
        <Flex
          css={{
            width: "100%",
            borderBottom: "1px solid $colors$neutral6",
            gap: "$3",
            fd: "row",
            ai: "center",
            jc: "space-between",
          }}>
          <Box>
            <Heading
              size="2"
              css={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "100%",
                ai: "flex-start",
              }}>
              {data.url}
            </Heading>
            <Text
              css={{
                my: "$2",
                color: "$gray11",
              }}>
              {data.name}
            </Text>
          </Box>

          <Flex css={{ ai: "flex-end", fg: "0", fs: "0", pl: "$3" }}>
            <Button
              onClick={() => {
                setDeleteDialogOpen(true);
              }}
              size="2"
              css={{ mr: "$2", display: "flex", ai: "center" }}
              variant="red">
              <StyledCross />
              Delete
            </Button>

            <Button
              size="2"
              css={{ display: "flex", ai: "center" }}
              onClick={() => dialogState.onToggle()}>
              <StyledPencil />
              Update details
            </Button>
          </Flex>
        </Flex>

        <Box>
          <Flex
            css={{
              pt: "$3",
              gap: "$3",
              fd: "row",
              ai: "center",
            }}>
            <Flex
              css={{
                borderRight: "1px solid $colors$neutral6",
                pr: "$5",
                gap: "$1",
                fd: "column",
              }}>
              <Text>Listening for</Text>
              <Tooltip
                multiline
                content={data.events.map((event) => (
                  <Box key={event}>{event}</Box>
                ))}>
                <Button
                  css={{
                    width: "80%",
                  }}>
                  {data.events.length} events
                </Button>
              </Tooltip>
            </Flex>
            <Flex
              css={{
                borderRight: "1px solid $colors$neutral6",
                pr: "$5",
                pl: "$1",
                gap: "$1",
                fd: "column",
                ai: "flex-start",
              }}>
              <Text>Signing secret</Text>
              <Text
                css={{
                  cursor: "pointer",
                  fontWeight: 500,
                }}
                variant={"green"}>
                Reveal
              </Text>
            </Flex>
            <Flex
              css={{
                gap: "$1",
                pl: "$1",
                fd: "column",
              }}>
              <Text>ID</Text>
              <Text>{data.id}</Text>
            </Flex>
          </Flex>
        </Box>
        <DetailsBox data={data} />
      </Box>

      <DeleteDialog
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        deleting={deleting}
        setDeleting={setDeleting}
        deleteWebhook={async () => deleteWebhook(data.id)}
        invalidateQuery={invalidateQuery}
      />

      <CreateEditDialog
        webhook={data}
        action={Action.Update}
        isOpen={dialogState.on}
        onOpenChange={dialogState.onToggle}
        onSubmit={async ({ events, name, url, sharedSecret }) => {
          delete data.event; // remove deprecated field before updating
          await updateWebhook(data.id, {
            ...data,
            events: events ? events : data.events,
            name: name ? name : data.name,
            url: url ? url : data.url,
            sharedSecret: sharedSecret ?? data.sharedSecret,
          });
          await invalidateQuery();
        }}
      />
    </Box>
  );
};

export default WebhookDetails;
