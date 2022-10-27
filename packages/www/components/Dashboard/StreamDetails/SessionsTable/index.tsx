import { useCallback, useMemo } from "react";
import { useApi } from "../../../../hooks";
import Table, { Fetcher, useTableState } from "components/Dashboard/Table";
import { Box, Heading, useSnackbar } from "@livepeer/design-system";
import {
  filterItems,
  makeColumns,
  rowsPageFromState,
  SessionsTableData,
} from "./helpers";

const SessionsTable = ({
  title = "Sessions",
  streamId,
  emptyState,
  border = false,
  tableLayout = "fixed",
}: {
  title?: string;
  streamId: string;
  emptyState?: React.ReactNode;
  border?: boolean;
  tableLayout?: string;
}) => {
  const { user, getStreamSessions } = useApi();
  const tableProps = useTableState({
    tableId: "streamSessionsTable",
  });
  const [openSnackbar] = useSnackbar();
  const columns = useMemo(makeColumns, []);
  const fetcher: Fetcher<SessionsTableData> = useCallback(
    async (state) =>
      rowsPageFromState(state, streamId, getStreamSessions, openSnackbar),
    [getStreamSessions, user.id]
  );

  return (
    <Box>
      <Table
        {...tableProps}
        header={<Heading>{title}</Heading>}
        border={border}
        filterItems={filterItems}
        columns={columns}
        fetcher={fetcher}
        rowSelection={null}
        initialSortBy={[{ id: "createdAt", desc: true }]}
        showOverflow={true}
        emptyState={emptyState}
        tableLayout={tableLayout}
      />
    </Box>
  );
};

export default SessionsTable;
