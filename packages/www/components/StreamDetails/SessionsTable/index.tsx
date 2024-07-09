import { useCallback, useMemo } from "react";
import { useApi } from "../../../hooks";
import Table, {
  DefaultSortBy,
  Fetcher,
  sortByToString,
  useTableState,
} from "components/Table";
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
  const { user, getStreamSessions, getClipsBySessionId } = useApi();
  const { state, stateSetter } = useTableState<SessionsTableData>({
    tableId: "streamSessionsTable",
    initialOrder: sortByToString(DefaultSortBy),
  });
  const [openSnackbar] = useSnackbar();
  const columns = useMemo(makeColumns, []);

  const fetcher: Fetcher<SessionsTableData> = useCallback(
    async (state) =>
      rowsPageFromState(
        state,
        streamId,
        getStreamSessions,
        getClipsBySessionId,
        openSnackbar,
      ),
    [getStreamSessions, user.id],
  );

  return (
    <Box>
      <Table
        header={<Heading>{title}</Heading>}
        state={state}
        stateSetter={stateSetter}
        border={border}
        filterItems={filterItems}
        columns={columns}
        fetcher={fetcher}
        rowSelection={null}
        initialSortBy={[DefaultSortBy]}
        showOverflow={true}
        emptyState={emptyState}
        tableLayout={tableLayout}
      />
    </Box>
  );
};

export default SessionsTable;
