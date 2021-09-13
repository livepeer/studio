import { useCallback, useMemo } from "react";
import { Column } from "react-table";
import { useQuery, useQueries, useQueryClient } from "react-query";

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
import { useApi, useAnalyzer } from "hooks";
import { HealthStatus } from "hooks/use-analyzer";

type HealthChecksTableData = {
  id: string;
  name: TextCellProps;
  status: TextCellProps;
};

const conditions = [
  "Transcoding",
  "TranscodeRealTime",
  "Multistreaming",
] as const;

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

  console.log(streamHealth);
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
      {
        Header: "Status",
        accessor: "status",
        Cell: TextCell,
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

  const conditionsMap = streamHealth.conditions.reduce(function (map, obj) {
    map[obj.type] = obj;
    return map;
  }, {});

  const tableData: TableData<HealthChecksTableData> = useMemo(() => {
    return {
      isLoading: false,
      data: {
        count: conditions.length,
        nextCursor: null,
        rows: conditions.map((condition, idx) => {
          const c = conditionsMap[condition];
          return {
            id: c.type,
            name: {
              children: <Box>{c.type}</Box>,
            },
            status: {
              children: (
                <Box>
                  {c.status === null ? "-" : c.status ? "Healthy" : "Unhealthy"}
                </Box>
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
