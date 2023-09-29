import { useCallback, useMemo } from "react";
import { useApi } from "../../hooks";
import Table, {
  DefaultSortBy,
  Fetcher,
  sortByToString,
  useTableState,
} from "components/Table";
import { useSnackbar } from "@livepeer/design-system";
import {
  filterItems,
  makeColumns,
  makeEmptyState,
  rowsPageFromState,
  ClipsTableData,
} from "./helpers";

const ClipsTable = ({ title = "Clips" }: { title?: string }) => {
  const { user, getStreamSessionsByUserId } = useApi();
  const { state, stateSetter } = useTableState<ClipsTableData>({
    tableId: "allSessionsTable",
    initialOrder: sortByToString(DefaultSortBy),
  });
  const [openSnackbar] = useSnackbar();
  const columns = useMemo(makeColumns, []);

  const fetcher: Fetcher<ClipsTableData> = useCallback(
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
      initialSortBy={[DefaultSortBy]}
      showOverflow={true}
      filterItems={filterItems}
      emptyState={makeEmptyState()}
    />
  );
};

export default ClipsTable;
