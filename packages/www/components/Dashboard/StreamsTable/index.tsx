import { useCallback, useMemo } from "react";
import { useApi } from "hooks";
import Table, {
  useTableState,
  Fetcher,
  DefaultSortBy,
  sortByToString,
} from "components/Dashboard/Table";
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
import { makeSelectAction, makeCreateAction } from "../Table/helpers";
import TableHeader from "../Table/components/TableHeader";
import TableStateDeleteDialog from "../Table/components/TableStateDeleteDialog";

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
  const { getStreams, createStream, deleteStream, deleteStreams } = useApi();
  const deleteDialogState = useToggleState();
  const createDialogState = useToggleState();
  const { state, stateSetter } = useTableState<StreamsTableData>({
    pageSize,
    tableId,
    initialOrder: sortByToString(DefaultSortBy),
  });
  const columns = useMemo(makeColumns, []);
  const fetcher: Fetcher<StreamsTableData> = useCallback(
    async (state) => rowsPageFromState(state, userId, getStreams),
    [userId]
  );

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
        initialSortBy={[DefaultSortBy]}
        emptyState={makeEmptyState(createDialogState)}
        selectAction={makeSelectAction("Delete", deleteDialogState.onOn)}
        createAction={makeCreateAction("Create stream", createDialogState.onOn)}
        header={
          <TableHeader title={title}>
            <ActiveStreamsBadge />
          </TableHeader>
        }
      />

      <TableStateDeleteDialog
        entityName={{ singular: "stream", plural: "streams" }}
        state={state}
        dialogToggleState={deleteDialogState}
        deleteFunction={deleteStream}
        deleteMultipleFunction={deleteStreams}
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
