import { useCallback, useMemo } from "react";
import Link from "next/link";
import { Column } from "react-table";
import { ArrowRightIcon, PlusIcon } from "@radix-ui/react-icons";
import { useQueries, useQueryClient } from "react-query";

import {
  Box,
  Flex,
  Heading,
  Text,
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
import { useToggleState } from "hooks/use-toggle-state";
import { useApi } from "hooks";
import { HealthStatus } from "hooks/use-analyzer";

import Toolbox from "./Toolbox";
import SaveTargetDialog, { Action } from "./SaveTargetDialog";
import TargetStatusBadge from "./TargetStatusBadge";

type TargetsTableData = {
  id: string;
  name: TextCellProps;
  profile: TextCellProps;
  status: TextCellProps;
  toolbox: TextCellProps;
};

const defaultEmptyState = (
  <Flex
    direction="column"
    justify="center"
    css={{
      margin: "0 auto",
      height: "calc(100vh - 400px)",
      maxWidth: 450,
    }}>
    <Heading css={{ fontWeight: 500, mb: "$3" }}>No targets</Heading>
    <Text variant="gray" css={{ lineHeight: 1.5, mb: "$3" }}>
      Multistream targets are sent the live media from the stream.
    </Text>
    <Link href="/docs/api-reference/session/overview" passHref>
      <A variant="violet" css={{ display: "flex", ai: "center", mb: "$5" }}>
        <Box>Learn more</Box>
        <ArrowRightIcon />
      </A>
    </Link>
  </Flex>
);

const MultistreamTargetsTable = ({
  title = "Multistream Targets",
  stream,
  streamHealth,
  invalidateStream,
  emptyState = defaultEmptyState,
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

  const columns: Column<TargetsTableData>[] = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name",
        Cell: TextCell,
        sortType: (...params: SortTypeArgs) =>
          stringSort("original.name.children", ...params),
      },
      {
        Header: "Profile",
        accessor: "profile",
        Cell: TextCell,
        sortType: (...params: SortTypeArgs) =>
          stringSort("original.profile.children", ...params),
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: TextCell,
        disableSortBy: true,
      },
      {
        Header: "",
        accessor: "toolbox",
        Cell: TextCell,
        disableSortBy: true,
      },
    ],
    []
  );

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

  const tableData: TableData<TargetsTableData> = useMemo(() => {
    return {
      isLoading: false,
      data: {
        count: targets.length,
        nextCursor: null,
        rows: targets.map((target, idx) => {
          const ref = targetRefs[idx];
          const status = streamHealth?.multistream?.find(
            (m) => m.target.id === ref.id && m.target.profile === ref.profile
          );
          return {
            id: ref.id,
            name: {
              children: (
                <Tooltip content={ref.id}>
                  <Label>{target?.name ?? "..."}</Label>
                </Tooltip>
              ),
            },
            profile: {
              children: ref.profile + (ref.videoOnly ? " (video-only)" : ""),
            },
            status: {
              children: (
                <TargetStatusBadge
                  stream={stream}
                  target={target}
                  status={status}
                  streamActiveSince={streamActiveSince}
                />
              ),
            },
            toolbox: {
              children: (
                <Toolbox
                  target={target}
                  stream={stream}
                  invalidateTargetId={invalidateTargetId}
                  invalidateStream={invalidateStream}
                />
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
        emptyState={emptyState}
        tableLayout={tableLayout}
        createAction={{
          onClick: saveDialogState.onOn,
          css: { display: "flex", alignItems: "center", ml: "$1" },
          children: (
            <>
              <PlusIcon />
              <Box as="span" css={{ ml: "$2" }}>
                Create
              </Box>
            </>
          ),
        }}
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
