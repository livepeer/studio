import { useMemo } from "react";
import { Column } from "react-table";
import { Box, Heading } from "@livepeer.com/design-system";
import { Stream } from "@livepeer.com/api";

import {
  DataTableComponent as Table,
  TableData,
  useTableState,
} from "components/Dashboard/Table";
import TextCell, { TextCellProps } from "components/Dashboard/Table/cells/text";
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
  const { state, stateSetter } = useTableState<HealthChecksTableData>({
    tableId: "HealthChecksTable",
  });

  const columns: Column<HealthChecksTableData>[] = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name",
        Cell: TextCell,
        disableSortBy: true,
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: TextCell,
        disableSortBy: true,
      },
    ],
    []
  );

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
              children: (
                <Box>
                  {condType === "TranscodeRealTime" ? "Realtime" : condType}
                </Box>
              ),
            },
            status: {
              children: (
                <Box>
                  {!stream.isActive || !cond || cond.status === null ? (
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
