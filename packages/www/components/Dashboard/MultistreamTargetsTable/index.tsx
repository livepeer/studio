import { useCallback, useMemo } from "react";
import { useApi } from "../../../hooks";
import Table, { Fetcher, useTableState } from "components/Dashboard/Table";
import TextCell, { TextCellProps } from "components/Dashboard/Table/cells/text";
import { stringSort } from "components/Dashboard/Table/sorts";
import Link from "next/link";
import { SortTypeArgs } from "components/Dashboard/Table/types";
import { Column } from "react-table";
import {
  Box,
  Flex,
  Heading,
  Text,
  Link as A,
  Tooltip,
} from "@livepeer.com/design-system";
import { Stream } from "@livepeer.com/api";
import { FilterItem } from "../Table/filters";
import {
  ArrowRightIcon,
  QuestionMarkCircledIcon as Help,
} from "@radix-ui/react-icons";
import Record from "components/Dashboard/StreamDetails/Record";
import { useQuery } from "react-query";

const filterItems: FilterItem[] = [
  { label: "Name", id: "name", type: "text" },
  { label: "Profile", id: "profile", type: "text" },
];

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
  const { user, getMultistreamTarget } = useApi();
  const { state, stateSetter } = useTableState<TargetsTableData>({
    tableId: "multistreamTargetsTable",
  });

  const invalidateTable = useCallback(async () => {
    await invalidateStream();
    await state.invalidate();
  }, [invalidateStream, state.tableId]);

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
    query: (state) =>
      useQuery([state.tableId, stream], async () => {
        const targets = await Promise.all(
          stream?.multistream?.targets?.map(async (ref) => {
            return { ref, spec: await getMultistreamTarget(ref.id) };
          }) ?? []
        );
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
                <Flex
                  align="stretch"
                  css={{ position: "relative", top: "2px" }}>
                  <Box css={{ mr: "$2" }}>
                    {/* TODO: Make this actually enable/disable MS targets */}
                    <Record stream={stream} invalidate={invalidateTable} />
                  </Box>
                  <Tooltip
                    multiline
                    content={
                      <Box>
                        Enable or disable multistreaming to this target.
                      </Box>
                    }>
                    <Help />
                  </Tooltip>
                </Flex>
              ),
            },
          })),
        };
      }),
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
