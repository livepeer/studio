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
} from "@livepeer.com/design-system";
import { Stream } from "@livepeer.com/api";
import { FilterItem } from "../Table/filters";
import { ArrowRightIcon } from "@radix-ui/react-icons";

const filterItems: FilterItem[] = [
  { label: "Name", id: "name", type: "text" },
  { label: "Profile", id: "profile", type: "text" },
];

type TargetsTableData = {
  id: string;
  name: TextCellProps;
  status: TextCellProps;
  profile: TextCellProps;
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
  emptyState = defaultEmptyState,
  border = false,
  tableLayout = "fixed",
}: {
  title?: string;
  stream: Stream;
  emptyState?: React.ReactNode;
  border?: boolean;
  tableLayout?: string;
}) => {
  const { user, getMultistreamTarget } = useApi();
  const tableProps = useTableState({
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
        Header: "Status",
        accessor: "status",
        Cell: TextCell,
        disableSortBy: true,
      },
      {
        Header: "Profile",
        accessor: "profile",
        Cell: TextCell,
        sortType: (...params: SortTypeArgs) =>
          stringSort("original.profile.children", ...params),
      },
    ],
    []
  );

  const fetcher: Fetcher<TargetsTableData> = useCallback(async () => {
    const targets = await Promise.all(
      stream.multistream?.targets?.map(async (ref) => {
        return { ref, spec: await getMultistreamTarget(ref.id) };
      })
    );
    return {
      count: targets.length,
      nextCursor: null,
      rows: targets.map((target) => ({
        id: target.ref.id,
        name: {
          children: target.spec.name,
        },
        status: {
          children: "unknown", // TODO: Call analyzer for the status
        },
        profile: {
          children: target.ref.profile,
        },
      })),
    };
  }, [getMultistreamTarget, user.id]);

  return (
    <Box>
      <Table
        {...tableProps}
        header={
          <>
            <Heading>{title}</Heading>
          </>
        }
        border={border}
        filterItems={filterItems}
        columns={columns}
        fetcher={fetcher}
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
