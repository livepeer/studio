import { useCallback, useMemo } from "react";
import Link from "next/link";
import { Column } from "react-table";
import { ArrowRightIcon, PlusIcon } from "@radix-ui/react-icons";
import { useQueries, useQuery, useQueryClient } from "react-query";

import {
  Box,
  Flex,
  Heading,
  Text,
  Link as A,
  Badge,
  Status,
} from "@livepeer.com/design-system";
import { MultistreamTarget, Stream } from "@livepeer.com/api";

import Table, { Fetcher, useTableState } from "components/Dashboard/Table";
import TextCell, { TextCellProps } from "components/Dashboard/Table/cells/text";
import { stringSort } from "components/Dashboard/Table/sorts";
import { SortTypeArgs } from "components/Dashboard/Table/types";
import { useToggleState } from "hooks/use-toggle-state";
import { MultistreamStatus } from "hooks/use-analyzer";

import { useAnalyzer, useApi } from "../../../hooks";
import Toolbox from "./Toolbox";
import CreateTargetDialog from "./CreateTargetDialog";

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

const TargetStatusBadge = ({
  isActive,
  status,
}: {
  isActive: boolean;
  status: MultistreamStatus;
}) => {
  const badgeProps = !isActive
    ? { variant: "gray", text: "Idle" }
    : !status
    ? { variant: "lime", text: "Pending", statusVariant: "yellow" }
    : !status?.connected
    ? { variant: "red", text: "Offline" }
    : { variant: "green", text: "Online" };
  return (
    <Badge size="2" variant={badgeProps.variant as any}>
      <Box css={{ mr: 5 }}>
        <Status
          size="1"
          variant={badgeProps.statusVariant ?? (badgeProps.variant as any)}
        />
      </Box>
      {badgeProps.text}
    </Badge>
  );
};

const MultistreamTargetsTable = ({
  title = "Multistream Targets",
  stream,
  invalidateStream,
  emptyState = defaultEmptyState,
  border = false,
  tableLayout = "fixed",
  ...props
}: {
  title?: string;
  stream: Stream;
  invalidateStream: () => Promise<void>;
  emptyState?: React.ReactNode;
  border?: boolean;
  tableLayout?: string;
}) => {
  const queryClient = useQueryClient();
  const { getMultistreamTarget } = useApi();
  const { getHealth } = useAnalyzer();
  const { state, stateSetter } = useTableState<TargetsTableData>({
    tableId: "multistreamTargetsTable",
  });
  const createDialogState = useToggleState();

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

  const fetcher: Fetcher<TargetsTableData> = {
    query: (state) => {
      const targetRefs = stream.multistream?.targets ?? [];
      const { data: streamStatus } = useQuery({
        queryKey: ["health", stream.id, targetRefs.length],
        queryFn: () =>
          targetRefs.length > 0 ? getHealth(stream.id) : Promise.resolve(null),
        refetchInterval: 5000,
      });

      const targetQueryKey = (id: string) => ["multistreamTarget", id];
      const invalidateTarget = useCallback(
        (id: string) => queryClient.invalidateQueries(targetQueryKey(id)),
        [queryClient]
      );
      const targets = useQueries(
        targetRefs.map((ref) => ({
          queryKey: targetQueryKey(ref.id),
          queryFn: () => getMultistreamTarget(ref.id),
        }))
      ).map((res) => res.data as MultistreamTarget);

      return useQuery(
        [state.tableId, streamStatus, stream.isActive, ...targets],
        () => {
          return {
            count: targets.length,
            nextCursor: null,
            rows: targets.map((target, idx) => {
              const ref = targetRefs[idx];
              const status = streamStatus?.multistream?.find(
                (m) => m.target.id === ref.id
              );
              return {
                id: ref.id,
                name: {
                  children: target?.name ?? "...",
                },
                profile: {
                  children: ref.profile,
                },
                status: {
                  children: (
                    <TargetStatusBadge
                      isActive={stream.isActive}
                      status={status}
                    />
                  ),
                },
                toolbox: {
                  children: (
                    <Toolbox
                      target={target}
                      stream={stream}
                      invalidateTarget={() => invalidateTarget(target.id)}
                      invalidateStream={invalidateStream}
                    />
                  ),
                },
              };
            }),
          };
        }
      );
    },
  };

  return (
    <Box {...props}>
      <Table
        fetcher={fetcher}
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
          onClick: createDialogState.onOn,
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

      <CreateTargetDialog
        isOpen={createDialogState.on}
        onOpenChange={createDialogState.onToggle}
        stream={stream}
        invalidateStream={invalidateStream}
      />
    </Box>
  );
};

export default MultistreamTargetsTable;
