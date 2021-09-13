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
import { useApi } from "hooks";
import { Condition, HealthStatus } from "hooks/use-analyzer";
import StatusBadge, { Variant as StatusVariant } from "../StatusBadge";

type HealthChecksTableData = {
  id: string;
  name: TextCellProps;
  status: TextCellProps;
};

const conditionTypes = [
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
      {
        Header: "Status",
        accessor: "status",
        Cell: TextCell,
      },
    ],
    []
  );

  // Only need this if we actually do some custom logic for the Multistream
  // healthcheck. If we do so, also consider moving these queries to the
  // top-level component instead (the stream detail/health pages).
  //
  // const targetQueryKey = (id: string) => ["multistreamTarget", id];
  // const targetRefs = stream.multistream?.targets ?? [];
  // const targets = useQueries(
  //   targetRefs.map((ref) => ({
  //     queryKey: targetQueryKey(ref.id),
  //     queryFn: () => getMultistreamTarget(ref.id),
  //   }))
  // ).map((res) => res.data as MultistreamTarget);

  const conditionsMap = useMemo(
    () =>
      streamHealth?.conditions.reduce(function (map, condition) {
        map[condition.type] = condition;
        return map;
      }, {} as Record<string, Condition>),
    [streamHealth?.conditions]
  );

  const tableData: TableData<HealthChecksTableData> = useMemo(() => {
    return {
      isLoading: false,
      data: {
        count: conditionTypes.length,
        nextCursor: null,
        rows: conditionTypes.map((condType) => {
          const cond = conditionsMap?.[condType];
          return {
            id: condType,
            name: {
              children: <Box>{condType}</Box>,
            },
            status: {
              children: (
                <Box>
                  {!cond || cond.status === null ? (
                    "-"
                  ) : (
                    <StatusBadge
                      variant={
                        cond.status
                          ? StatusVariant.Healthy
                          : StatusVariant.Unhealthy
                      }
                      timestamp={cond?.lastProbeTime}
                    />
                  )}
                </Box>
              ),
            },
          };
        }),
      },
    };
  }, [state.tableId, stream, conditionsMap]);

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
