import { useCallback, useMemo } from "react";
import { useApi } from "../../../hooks";
import Table, { Fetcher, useTableState } from "components/Dashboard/Table";
import { useSnackbar } from "@livepeer/design-system";
import {
  filterItems,
  makeColumns,
  rowsPageFromState,
  StreamSessionsTableData,
} from "./helpers";
import EmptyState from "./EmptyState";

const StreamSessionsTable = ({ title = "Sessions" }: { title?: string }) => {
  const { user, getStreamSessionsByUserId } = useApi();
  const { state, stateSetter } = useTableState<StreamSessionsTableData>({
    tableId: "allSessionsTable",
  });
  const [openSnackbar] = useSnackbar();
  const columns = useMemo(makeColumns, []);

  const fetcher: Fetcher<StreamSessionsTableData> = useCallback(
    async (state) =>
      rowsPageFromState(
        state,
        user.id,
        getStreamSessionsByUserId,
        openSnackbar
      ),
    [getStreamSessionsByUserId, user.id]
  );

  return (
    <Table
      title={title}
      state={state}
      stateSetter={stateSetter}
      columns={columns}
      fetcher={fetcher}
      initialSortBy={[{ id: "createdAt", desc: true }]}
      showOverflow={true}
      filterItems={filterItems}
      emptyState={<EmptyState />}
    />
  );
};

export default StreamSessionsTable;
