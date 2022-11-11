import { useCallback, useMemo, useState } from "react";
import { useApi } from "../../../hooks";
import Table, { Fetcher, useTableState } from "components/Dashboard/Table";
import CreateDialog from "./CreateDialog";
import { useToggleState } from "hooks/use-toggle-state";
import {
  ApiKeysTableData,
  makeColumns,
  makeEmptyState,
  rowsPageFromState,
} from "./helpers";
import { makeCreateAction, makeSelectAction } from "../Table/helpers";
import TableStateDeleteDialog from "../Table/components/TableStateDeleteDialog";

const ApiKeysTable = ({
  title = "API Keys",
  userId,
}: {
  title?: string;
  userId: string;
}) => {
  const { getApiTokens, deleteApiToken } = useApi();
  const { state, stateSetter } = useTableState<ApiKeysTableData>({
    tableId: "tokenTable",
  });
  const deleteDialogState = useToggleState();
  const createDialogState = useToggleState();
  const columns = useMemo(makeColumns, []);

  const fetcher: Fetcher<ApiKeysTableData> = useCallback(
    async () => rowsPageFromState(userId, getApiTokens),
    [userId]
  );

  return (
    <>
      <Table
        title={title}
        state={state}
        stateSetter={stateSetter}
        columns={columns}
        fetcher={fetcher}
        rowSelection="all"
        emptyState={makeEmptyState(createDialogState)}
        selectAction={makeSelectAction("Delete", deleteDialogState.onOn)}
        createAction={makeCreateAction(
          "Create an API Key",
          createDialogState.onOn
        )}
      />

      <TableStateDeleteDialog
        entityName={{ singular: "API key", plural: "API keys" }}
        state={state}
        dialogToggleState={deleteDialogState}
        deleteFunction={deleteApiToken}
      />

      <CreateDialog
        isOpen={createDialogState.on}
        onClose={createDialogState.onOff}
        onOpenChange={createDialogState.onToggle}
        onCreateSuccess={state.invalidate}
      />
    </>
  );
};

export default ApiKeysTable;
