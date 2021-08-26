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
} from "@livepeer.com/design-system";
import { MultistreamTarget, Stream } from "@livepeer.com/api";

import Table, { Fetcher, useTableState } from "components/Dashboard/Table";
import TextCell, { TextCellProps } from "components/Dashboard/Table/cells/text";
import { stringSort } from "components/Dashboard/Table/sorts";
import { SortTypeArgs } from "components/Dashboard/Table/types";
import { useToggleState } from "hooks/use-toggle-state";

import { useApi } from "../../../hooks";
import Toolbox from "./Toolbox";
import CreateTargetDialog from "./CreateTargetDialog";

type TargetInfo = {
  ref: Stream["multistream"]["targets"][number];
  spec: MultistreamTarget;
};

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
      const targetQueryKey = (id: string) => ["multistreamTarget", id];
      const invalidateTarget = useCallback(
        (id: string) => queryClient.invalidateQueries(targetQueryKey(id)),
        [queryClient]
      );
      const targets = useQueries(
        stream?.multistream?.targets?.map((ref) => ({
          queryKey: targetQueryKey(ref.id),
          queryFn: async () => {
            const spec = await getMultistreamTarget(ref.id);
            return { ref, spec } as TargetInfo;
          },
        })) ?? []
      ).map((res) => res.data as TargetInfo);

      return useQuery(
        [state.tableId, ...targets],
        () => {
          return {
            count: targets.length,
            nextCursor: null,
            rows: targets.map((target) => ({
              id: target.ref.id,
              name: {
                children: target.spec.name,
              },
              profile: {
                children: target.ref.profile,
              },
              status: {
                children: "unknown", // TODO: Call analyzer for the status
              },
              toolbox: {
                children: (
                  <Toolbox
                    target={target.spec}
                    stream={stream}
                    invalidateTarget={() => invalidateTarget(target.ref.id)}
                    invalidateStream={invalidateStream}
                  />
                ),
              },
            })),
          };
        },
        { enabled: targets.every((t) => !!t) }
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
        initialSortBy={[{ id: "name", desc: false }]}
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
        setOpen={createDialogState.onToggle}
        stream={stream}
        invalidateStream={invalidateStream}
      />
    </Box>
  );
};

export default MultistreamTargetsTable;
