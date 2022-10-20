import { useCallback, useMemo, useState } from "react";
import { useApi } from "../../../hooks";
import Table, { Fetcher, useTableState } from "components/Dashboard/Table";
import { Box, Heading } from "@livepeer/design-system";
import { useToggleState } from "hooks/use-toggle-state";
import { Cross1Icon, PlusIcon } from "@radix-ui/react-icons";
import CreateDialog, {
  Action,
} from "@components/Dashboard/WebhookDialogs/CreateDialog";
import { useRouter } from "next/router";
import { makeColumns, rowsPageFromState, WebhooksTableData } from "./helpers";
import EmptyState from "./EmptyState";
import DeleteAlertDialog from "../WebhookDialogs/DeleteAlertDialog";

const WebhooksTable = ({ title = "Webhooks" }: { title?: string }) => {
  const router = useRouter();
  const { user, getWebhooks, deleteWebhook, deleteWebhooks, createWebhook } =
    useApi();
  const deleteDialogState = useToggleState();
  const [savingDeleteDialog, setSavingDeleteDialog] = useState(false);
  const createDialogState = useToggleState();
  const { state, stateSetter } = useTableState<WebhooksTableData>({
    tableId: "webhooksTable",
  });

  const columns = useMemo(makeColumns, []);

  const fetcher: Fetcher<WebhooksTableData> = useCallback(
    async (state) => rowsPageFromState(state, getWebhooks),
    [getWebhooks, user.id]
  );

  const onDeleteWebhooks = useCallback(async () => {
    if (state.selectedRows.length === 1) {
      await deleteWebhook(state.selectedRows[0].id);
      await state.invalidate();
      deleteDialogState.onOff();
    } else if (state.selectedRows.length > 1) {
      await deleteWebhooks(state.selectedRows.map((s) => s.id));
      await state.invalidate();
      deleteDialogState.onOff();
    }
  }, [
    deleteWebhook,
    deleteWebhooks,
    deleteDialogState.onOff,
    state.selectedRows.length,
    state.invalidate,
  ]);

  return (
    <Box css={{ p: "$6", mb: "$8" }}>
      <Table
        columns={columns}
        fetcher={fetcher}
        state={state}
        stateSetter={stateSetter}
        rowSelection="all"
        emptyState={<EmptyState createDialogState={createDialogState} />}
        header={
          <Heading size="2" css={{ fontWeight: 600 }}>
            {title}
          </Heading>
        }
        selectAction={{
          onClick: deleteDialogState.onOn,
          children: (
            <>
              <Cross1Icon />{" "}
              <Box css={{ ml: "$2" }} as="span">
                Delete
              </Box>
            </>
          ),
        }}
        createAction={{
          onClick: createDialogState.onOn,
          css: { display: "flex", alignItems: "center" },
          children: (
            <>
              <PlusIcon />{" "}
              <Box as="span" css={{ ml: "$2" }}>
                Create webhook
              </Box>
            </>
          ),
        }}
      />

      <DeleteAlertDialog
        deleteDialogState={deleteDialogState}
        state={state}
        savingDeleteDialog={savingDeleteDialog}
        setSavingDeleteDialog={setSavingDeleteDialog}
        onDeleteWebhooks={onDeleteWebhooks}
      />

      <CreateDialog
        action={Action.Create}
        isOpen={createDialogState.on}
        onOpenChange={createDialogState.onToggle}
        onSubmit={async ({ events, name, url }) => {
          const newWebhook = await createWebhook({
            events,
            name,
            url,
          });
          await state.invalidate();
          const query = router.query.admin === "true" ? { admin: true } : {};
          await router.push({
            pathname: `/dashboard/developers/webhooks/${newWebhook.id}`,
            query,
          });
        }}
      />
    </Box>
  );
};

export default WebhooksTable;
