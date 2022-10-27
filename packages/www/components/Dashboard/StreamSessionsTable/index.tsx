import { useCallback, useMemo } from "react";
import { useApi } from "../../../hooks";
import Table, { Fetcher, useTableState } from "components/Dashboard/Table";
import { Heading, useSnackbar } from "@livepeer/design-system";
import {
  filterItems,
  makeColumns,
  rowsPageFromState,
  SessionsTableData,
} from "./helpers";
import EmptyState from "./EmptyState";

const StreamSessionsTable = ({ title = "Sessions" }: { title?: string }) => {
  const { user, getStreamSessionsByUserId } = useApi();
  const tableProps = useTableState({
    tableId: "allSessionsTable",
  });
  const [openSnackbar] = useSnackbar();
  const columns = useMemo(makeColumns, []);

  const fetcher: Fetcher<SessionsTableData> = useCallback(
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
      {...tableProps}
      columns={columns}
      fetcher={fetcher}
      initialSortBy={[{ id: "createdAt", desc: true }]}
      showOverflow={true}
      filterItems={filterItems}
      emptyState={<EmptyState />}
      header={
        <Heading size="2" css={{ fontWeight: 600 }}>
          {title}
        </Heading>
      }
    />
  );
};

export default StreamSessionsTable;
