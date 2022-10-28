import { useCallback, useMemo, useState } from "react";
import { useApi } from "../../../hooks";
import Table, { Fetcher, useTableState } from "components/Dashboard/Table";
import { Box } from "@livepeer/design-system";
import { useToggleState } from "hooks/use-toggle-state";
import CreateDialog, {
  Action,
} from "@components/Dashboard/WebhookDialogs/CreateEditDialog";
import { useRouter } from "next/router";
import { makeColumns, rowsPageFromState, WebhooksTableData } from "./helpers";
import EmptyState from "./EmptyState";
import DeleteDialog from "./DeleteDialog";
import { makeCreateAction, makeSelectAction } from "../Table/helpers";

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

  const onCreateSubmit = async ({ events, name, url, sharedSecret }) => {
    const newWebhook = await createWebhook({
      events,
      name,
      url,
      sharedSecret,
    });
    await state.invalidate();
    const query = router.query.admin === "true" ? { admin: true } : {};
    await router.push({
      pathname: `/dashboard/developers/webhooks/${newWebhook.id}`,
      query,
    });
  };

  return (
    <Box css={{ p: "$6", mb: "$8" }}>
      <Table
        title={title}
        columns={columns}
        fetcher={fetcher}
        state={state}
        stateSetter={stateSetter}
        rowSelection="all"
        emptyState={<EmptyState createDialogState={createDialogState} />}
        selectAction={makeSelectAction("Delete", deleteDialogState.onOn)}
        createAction={makeCreateAction(
          "Create webhook",
          createDialogState.onOn
        )}
      />

      <DeleteDialog
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
        onSubmit={onCreateSubmit}
      />
    </Box>
  );
};

export default WebhooksTable;
