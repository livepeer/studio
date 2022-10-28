import { useCallback, useMemo, useState } from "react";
import { useApi } from "hooks";
import Table, { useTableState, Fetcher } from "components/Dashboard/Table";
import { useToggleState } from "hooks/use-toggle-state";
import CreateStreamDialog from "./CreateStreamDialog";
import { useRouter } from "next/router";
import ActiveStreamsBadge from "components/Dashboard/ActiveStreamsBadge";
import {
  defaultCreateProfiles,
  filterItems,
  makeColumns,
  makeEmptyState,
  rowsPageFromState,
  StreamsTableData,
} from "./helpers";
import DeleteDialog from "./DeleteDialog";
import { makeSelectAction, makeCreateAction } from "../Table/helpers";
import TableHeader from "../Table/components/TableHeader";

const StreamsTable = ({
  title = "Streams",
  pageSize = 20,
  tableId,
  userId,
  viewAll,
}: {
  title: string;
  pageSize?: number;
  userId: string;
  tableId: string;
  viewAll?: string;
}) => {
  const router = useRouter();
  const { getStreams, deleteStream, deleteStreams, createStream } = useApi();
  const [savingDeleteDialog, setSavingDeleteDialog] = useState(false);
  const deleteDialogState = useToggleState();
  const createDialogState = useToggleState();
  const { state, stateSetter } = useTableState<StreamsTableData>({
    pageSize,
    tableId,
  });
  const columns = useMemo(makeColumns, []);
  const fetcher: Fetcher<StreamsTableData> = useCallback(
    async (state) => rowsPageFromState(state, userId, getStreams),
    [userId]
  );

  const onDeleteStreams = useCallback(async () => {
    if (state.selectedRows.length === 1) {
      await deleteStream(state.selectedRows[0].id);
      await state.invalidate();
      deleteDialogState.onOff();
    } else if (state.selectedRows.length > 1) {
      await deleteStreams(state.selectedRows.map((s) => s.id));
      await state.invalidate();
      deleteDialogState.onOff();
    }
  }, [
    deleteStream,
    deleteStreams,
    deleteDialogState.onOff,
    state.selectedRows.length,
    state.invalidate,
  ]);

  const onCreateClick = useCallback(
    async (streamName: string) => {
      const newStream = await createStream({
        name: streamName,
        profiles: defaultCreateProfiles,
      });
      await state.invalidate();
      const query = router.query.admin === "true" ? { admin: true } : {};
      await router.push({
        pathname: `/dashboard/streams/${newStream.id}`,
        query,
      });
    },
    [createStream, state.invalidate]
  );

  return (
    <>
      <Table
        columns={columns}
        fetcher={fetcher}
        state={state}
        stateSetter={stateSetter}
        rowSelection="all"
        filterItems={!viewAll && filterItems}
        viewAll={viewAll}
        initialSortBy={[{ id: "createdAt", desc: true }]}
        emptyState={makeEmptyState(createDialogState)}
        selectAction={makeSelectAction("Delete", deleteDialogState.onOn)}
        createAction={makeCreateAction("Create stream", createDialogState.onOn)}
        header={
          <TableHeader title={title}>
            <ActiveStreamsBadge />
          </TableHeader>
        }
      />

      <DeleteDialog
        state={state}
        deleteDialogState={deleteDialogState}
        savingDeleteDialog={savingDeleteDialog}
        setSavingDeleteDialog={setSavingDeleteDialog}
        onDeleteStreams={onDeleteStreams}
      />

      <CreateStreamDialog
        isOpen={createDialogState.on}
        onOpenChange={createDialogState.onToggle}
        onCreate={onCreateClick}
      />
    </>
  );
};

export default StreamsTable;
