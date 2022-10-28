import { useCallback, useMemo } from "react";
import { useApi } from "../../../hooks";
import Table, { Fetcher, useTableState } from "components/Dashboard/Table";
import { useToggleState } from "hooks/use-toggle-state";
import {
  makeColumns,
  makeEmptyState,
  rowsPageFromState,
  SigningKeysTableData,
} from "./helpers";
import CreateDialog from "./CreateDialog";
import DeleteDialog from "./DeleteDialog";
import { makeSelectAction, makeCreateAction } from "../Table/helpers";

const SigningKeysTable = ({
  title = "Signing Keys",
  pageSize = 20,
  tableId,
}: {
  title?: string;
  pageSize?: number;
  tableId: string;
}) => {
  const { getSigningKeys } = useApi();
  const { state, stateSetter } = useTableState<SigningKeysTableData>({
    pageSize,
    tableId,
  });
  const deleteDialogState = useToggleState();
  const createDialogState = useToggleState();

  const columns = useMemo(makeColumns, []);

  const fetcher: Fetcher<SigningKeysTableData> = useCallback(
    async (state) => rowsPageFromState(state, getSigningKeys),
    []
  );

  return (
    <>
      <Table
        title={title}
        columns={columns}
        fetcher={fetcher}
        rowSelection="all"
        state={state}
        stateSetter={stateSetter}
        initialSortBy={[{ id: "createdAt", desc: true }]}
        emptyState={makeEmptyState(createDialogState)}
        selectAction={makeSelectAction("Delete", deleteDialogState.onOn)}
        createAction={makeCreateAction("Create key", createDialogState.onOn)}
      />

      <DeleteDialog state={state} deleteDialogState={deleteDialogState} />

      <CreateDialog
        isOpen={createDialogState.on}
        onClose={createDialogState.onOff}
        onOpenChange={createDialogState.onToggle}
        onCreateSuccess={state.invalidate}
      />
    </>
  );
};

export default SigningKeysTable;
