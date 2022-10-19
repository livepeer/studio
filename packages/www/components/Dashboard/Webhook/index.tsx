import {
  Text,
  Box,
  Flex,
  Heading,
  Button,
  styled,
} from "@livepeer/design-system";
import { useToggleState } from "hooks/use-toggle-state";
import { useState, useCallback } from "react";
import { useQueryClient } from "react-query";
import { Action } from "../MultistreamTargetsTable/SaveTargetDialog";
import CreateDialog from "../WebhookDialogs/CreateDialog";
import { Cross1Icon, Pencil1Icon } from "@radix-ui/react-icons";
import { useApi } from "hooks";
import DeleteAlertDialog from "./DeleteAlertDialog";
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

const Webhook = ({ id, data }) => {
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
          border: "1px solid $colors$primary7",
        }}>
        <Flex
          css={{
            p: "$3",
            width: "100%",
            borderBottom: "1px solid $colors$primary7",
            gap: "$3",
            fd: "row",
            ai: "center",
            jc: "space-between",
          }}>
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

        <DetailsBox data={data} />
      </Box>

      <DeleteAlertDialog
        deleteDialogOpen={deleteDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        deleting={deleting}
        setDeleting={setDeleting}
        deleteWebhook={async () => deleteWebhook(data.id)}
        invalidateQuery={invalidateQuery}
      />

      <CreateDialog
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

export default Webhook;
