import { useCallback, useMemo } from "react";
import Link from "next/link";
import { Column } from "react-table";
import { ArrowRightIcon } from "@radix-ui/react-icons";
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

import { useApi } from "../../../hooks";
import { FilterItem } from "../Table/filters";
import Toolbox from "./toolbox";

const filterItems: FilterItem[] = [
  { label: "Name", id: "name", type: "text" },
  { label: "Profile", id: "profile", type: "text" },
];

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
}: {
  title?: string;
  stream: Stream;
  invalidateStream: () => Promise<void>;
  emptyState?: React.ReactNode;
  border?: boolean;
  tableLayout?: string;
}) => {
  const queryClient = useQueryClient();
  const { user, getMultistreamTarget } = useApi();
  const { state, stateSetter } = useTableState<TargetsTableData>({
    tableId: "multistreamTargetsTable",
  });

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

  const targets = useQueries(
    stream?.multistream?.targets?.map((ref) => ({
      queryKey: ["multistreamTarget", ref.id],
      queryFn: async () => {
        return { ref, spec: await getMultistreamTarget(ref.id) } as TargetInfo;
      },
    })) ?? []
  ).map((res) => res.data as TargetInfo);
  const invalidateTarget = useCallback(
    (id: string) => queryClient.invalidateQueries(["multistreamTarget", id]),
    [queryClient]
  );

  const fetcher: Fetcher<TargetsTableData> = {
    query: (state) => {
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
    <Box>
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
        filterItems={filterItems}
        columns={columns}
        rowSelection={null}
        initialSortBy={[{ id: "name", desc: false }]}
        showOverflow={true}
        emptyState={emptyState}
        tableLayout={tableLayout}
      />
    </Box>
  );
};

export default MultistreamTargetsTable;
