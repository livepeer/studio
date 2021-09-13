import { useCallback, useMemo } from "react";
import { Column } from "react-table";
import { useQueries, useQueryClient } from "react-query";

import {
  Box,
  Heading,
  Link as A,
  Tooltip,
  Label,
} from "@livepeer.com/design-system";
import { MultistreamTarget, Stream } from "@livepeer.com/api";

import {
  DataTableComponent as Table,
  TableData,
  useTableState,
} from "components/Dashboard/Table";
import TextCell, { TextCellProps } from "components/Dashboard/Table/cells/text";
import { stringSort } from "components/Dashboard/Table/sorts";
import { SortTypeArgs } from "components/Dashboard/Table/types";
import { useApi } from "hooks";
import { HealthStatus } from "hooks/use-analyzer";

type HealthChecksTableData = {
  id: string;
  name: TextCellProps;
};

const HealthChecksTable = ({
  title = "Health Checks",
  stream,
  streamHealth,
  invalidateStream,
  border = false,
  tableLayout = "fixed",
  ...props
}: {
  title?: string;
  stream: Stream;
  streamHealth?: HealthStatus;
  invalidateStream: (optm?: Stream) => Promise<void>;
  emptyState?: React.ReactNode;
  border?: boolean;
  tableLayout?: string;
}) => {
  const queryClient = useQueryClient();
  const { getMultistreamTarget } = useApi();
  const { state, stateSetter } = useTableState<HealthChecksTableData>({
    tableId: "HealthChecksTable",
  });

  const columns: Column<HealthChecksTableData>[] = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name",
        Cell: TextCell,
        sortType: (...params: SortTypeArgs) =>
          stringSort("original.name.children", ...params),
      },
    ],
    []
  );

  const targetQueryKey = (id: string) => ["multistreamTarget", id];

  const targetRefs = stream.multistream?.targets ?? [];
  const targets = useQueries(
    targetRefs.map((ref) => ({
      queryKey: targetQueryKey(ref.id),
      queryFn: () => getMultistreamTarget(ref.id),
    }))
  ).map((res) => res.data as MultistreamTarget);

  const tableData: TableData<HealthChecksTableData> = useMemo(() => {
    return {
      isLoading: false,
      data: {
        count: targets.length,
        nextCursor: null,
        rows: targets.map((target, idx) => {
          const ref = targetRefs[idx];
          return {
            id: ref.id,
            name: {
              children: (
                <Tooltip content={ref.id}>
                  <Label>{target?.name ?? "..."}</Label>
                </Tooltip>
              ),
            },
          };
        }),
      },
    };
  }, [state.tableId, stream, streamHealth, ...targets]);

  return (
    <Box {...props}>
      <Table
        tableData={tableData}
        state={state}
        stateSetter={stateSetter}
        header={
          <>
            <Heading>{title}</Heading>
          </>
        }
        border={border}
        columns={columns}
        rowSelection={null}
        showOverflow={true}
        noPagination={true}
        tableLayout={tableLayout}
      />
    </Box>
  );
};

export default HealthChecksTable;
