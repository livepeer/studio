import { useCallback, useMemo } from "react";
import { useQueries, useQueryClient } from "react-query";
import { Box, Heading } from "@livepeer/design-system";
import { MultistreamTarget, Stream } from "@livepeer.studio/api";
import {
  DataTableComponent as Table,
  TableData,
  useTableState,
} from "components/Dashboard/Table";
import { useToggleState } from "hooks/use-toggle-state";
import { useApi } from "hooks";
import { HealthStatus } from "hooks/use-analyzer";
import SaveTargetDialog, { Action } from "./SaveTargetDialog";
import ErrorDialog from "../../ErrorDialog";
import { makeColumns, makeTableData, TargetsTableData } from "./helpers";
import { makeCreateAction } from "@components/Dashboard/Table/helpers";

const MultistreamTargetsTable = ({
  title = "Multistream Targets",
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
  const queryClient = useQueryClient();
  const { getMultistreamTarget } = useApi();
  const { state, stateSetter } = useTableState<TargetsTableData>({
    tableId: "multistreamTargetsTable",
  });
  const saveDialogState = useToggleState();
  const errorRecordDialogState = useToggleState();

  const columns = useMemo(makeColumns, []);

  const targetQueryKey = (id: string) => ["multistreamTarget", id];
  const invalidateTargetId = useCallback(
    (id: string) => queryClient.invalidateQueries(targetQueryKey(id)),
    [queryClient]
  );
  const targetRefs = stream.multistream?.targets ?? [];
  const targets = useQueries(
    targetRefs.map((ref) => ({
      queryKey: targetQueryKey(ref.id),
      queryFn: () => getMultistreamTarget(ref.id),
    }))
  ).map((res) => res.data as MultistreamTarget);
  const streamActiveSince = useMemo(() => {
    const activeCondition = streamHealth?.conditions.find(
      (c) => c.type === "Active"
    );
    return activeCondition?.status ? activeCondition.lastTransitionTime : null;
  }, [streamHealth?.conditions]);

  const tableData: TableData<TargetsTableData> = useMemo(
    () =>
      makeTableData(
        stream,
        streamHealth,
        streamActiveSince,
        targets,
        targetRefs,
        invalidateStream,
        invalidateTargetId
      ),
    [state.tableId, stream, streamHealth, ...targets]
  );

  const onCreateClick = stream.isActive
    ? errorRecordDialogState.onOn
    : saveDialogState.onOn;

  return (
    <Box {...props}>
      <Table
        header={<Heading>{title}</Heading>}
        tableData={tableData}
        state={state}
        stateSetter={stateSetter}
        border={border}
        columns={columns}
        rowSelection={null}
        showOverflow={true}
        noPagination={true}
        emptyState={emptyState}
        tableLayout={tableLayout}
        createAction={makeCreateAction("Create", onCreateClick)}
      />

      <ErrorDialog
        isOpen={errorRecordDialogState.on}
        onOpenChange={errorRecordDialogState.onToggle}
        description="You cannot change multistream preferences while a session is active"
      />

      <SaveTargetDialog
        action={Action.Create}
        isOpen={saveDialogState.on}
        onOpenChange={saveDialogState.onToggle}
        stream={stream}
        invalidate={invalidateStream}
      />
    </Box>
  );
};

export default MultistreamTargetsTable;
