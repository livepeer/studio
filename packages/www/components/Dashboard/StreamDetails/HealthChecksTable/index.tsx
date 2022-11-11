import { useMemo } from "react";
import { Box, Heading } from "@livepeer/design-system";
import { Stream } from "@livepeer.studio/api";
import {
  DataTableComponent as Table,
  TableData,
  useTableState,
} from "components/Dashboard/Table";
import { Condition, HealthStatus } from "hooks/use-analyzer";
import { HealthChecksTableData, makeColumns, makeTableData } from "./helpers";

const HealthChecksTable = ({
  title = "Health Checks",
  stream,
  streamHealth,
  invalidateStream,
  emptyState,
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

  const columns = useMemo(makeColumns, []);

  const conditionsMap = useMemo(
    () =>
      (streamHealth?.conditions ?? []).reduce(function (map, condition) {
        map[condition.type] = condition;
        return map;
      }, {} as Record<Condition["type"], Condition>),
    [streamHealth?.conditions]
  );
  const streamActiveSince = useMemo(
    () =>
      conditionsMap.Active?.status
        ? conditionsMap.Active.lastTransitionTime
        : null,
    [conditionsMap.Active]
  );

  const tableData: TableData<HealthChecksTableData> = useMemo(
    () => makeTableData(conditionsMap, stream, streamActiveSince),
    [state.tableId, stream, streamActiveSince, conditionsMap]
  );

  return (
    <Box {...props}>
      <Table
        header={<Heading>{title}</Heading>}
        state={state}
        stateSetter={stateSetter}
        tableData={tableData}
        border={border}
        columns={columns}
        rowSelection={null}
        showOverflow={true}
        noPagination={true}
        tableLayout={tableLayout}
        emptyState={emptyState}
      />
    </Box>
  );
};

export default HealthChecksTable;
