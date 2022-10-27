import { Heading, Box, Flex } from "@livepeer/design-system";
import { useCallback, useMemo, useState } from "react";
import { useApi } from "hooks";
import Table, { useTableState, Fetcher } from "components/Dashboard/Table";
import { Cross1Icon, PlusIcon } from "@radix-ui/react-icons";
import { useToggleState } from "hooks/use-toggle-state";
import CreateStreamDialog from "./CreateStreamDialog";
import { useRouter } from "next/router";
import ActiveStreamsBadge from "components/Dashboard/ActiveStreamsBadge";
import EmptyState from "./EmptyState";
import {
  defaultCreateProfiles,
  filterItems,
  makeColumns,
  rowsPageFromState,
  StreamsTableData,
} from "./helpers";
import DeleteDialog from "./DeleteDialog";

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
        emptyState={<EmptyState createDialogState={createDialogState} />}
        viewAll={viewAll}
        header={
          <Heading size="2">
            <Flex>
              <Box css={{ mr: "$3", fontWeight: 600, letterSpacing: 0 }}>
                {title}
              </Box>
              <ActiveStreamsBadge />
            </Flex>
          </Heading>
        }
        initialSortBy={[{ id: "createdAt", desc: true }]}
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
          css: { display: "flex", alignItems: "center", ml: "$1" },
          children: (
            <>
              <PlusIcon />{" "}
              <Box as="span" css={{ ml: "$2" }}>
                Create stream
              </Box>
            </>
          ),
        }}
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
