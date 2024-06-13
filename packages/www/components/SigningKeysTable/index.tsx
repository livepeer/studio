import { useCallback, useMemo } from "react";
import { useApi } from "../../hooks";
import Table, {
  DefaultSortBy,
  Fetcher,
  sortByToString,
  useTableState,
} from "components/Table";
import { useToggleState } from "hooks/use-toggle-state";
import {
  makeColumns,
  makeEmptyState,
  rowsPageFromState,
  SigningKeysTableData,
} from "./helpers";
import CreateDialog from "./CreateDialog";
import { makeSelectAction, makeCreateAction } from "../Table/helpers";
import TableStateDeleteDialog from "../Table/components/TableStateDeleteDialog";

const SigningKeysTable = ({
  title = "Signing Keys",
  pageSize = 20,
  tableId,
}: {
  title?: string;
  pageSize?: number;
  tableId: string;
}) => {
  const { getSigningKeys, deleteSigningKey } = useApi();
  const { state, stateSetter } = useTableState<SigningKeysTableData>({
    pageSize,
    tableId,
    initialOrder: sortByToString(DefaultSortBy),
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
        initialSortBy={[DefaultSortBy]}
        emptyState={makeEmptyState(createDialogState)}
        selectAction={makeSelectAction("Delete", deleteDialogState.onOn)}
        createAction={makeCreateAction(
          "Create signing key",
          createDialogState.onOn
        )}
      />

      <TableStateDeleteDialog
        entityName={{ singular: "signing key", plural: "signing keys" }}
        state={state}
        dialogToggleState={deleteDialogState}
        deleteFunction={deleteSigningKey}
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

export default SigningKeysTable;
