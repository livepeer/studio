import { useCallback, useMemo, useState } from "react";
import { useApi } from "../../hooks";
import Table, {
  DefaultSortBy,
  Fetcher,
  sortByToString,
  useTableState,
} from "components/Table";
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
import { useJune, events } from "hooks/use-june";

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
    initialOrder: sortByToString(DefaultSortBy),
  });
  const deleteDialogState = useToggleState();
  const createDialogState = useToggleState();
  const columns = useMemo(makeColumns, []);
  const June = useJune();

  const fetcher: Fetcher<ApiKeysTableData> = useCallback(
    async () => rowsPageFromState(userId, getApiTokens),
    [userId]
  );

  const trackEvent = useCallback(() => {
    if (June) June.track(events.developer.apiKeyCreate);
  }, [June]);

  return (
    <>
      <Table
        title={title}
        state={state}
        stateSetter={stateSetter}
        columns={columns}
        fetcher={fetcher}
        rowSelection="all"
        initialSortBy={[DefaultSortBy]}
        emptyState={makeEmptyState(createDialogState)}
        selectAction={makeSelectAction("Delete", deleteDialogState.onOn)}
        createAction={makeCreateAction("Create API Key", () => {
          trackEvent();
          return createDialogState.onOn();
        })}
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
