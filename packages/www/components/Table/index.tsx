import { Row, useRowSelect, useSortBy, useTable } from "react-table";
import {
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from "react-query";
import {
  useEffect,
  useMemo,
  useCallback,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  Heading,
  Link as A,
} from "@livepeer/design-system";
import { Flex } from "components/ui/flex";
import { Box } from "components/ui/box";
import { Button } from "components/ui/button";
import { Text } from "components/ui/text";
import TableFilter, {
  FilterItem,
  Filter as TFilter,
  formatFiltersForApiRequest,
} from "./filters";
import Link from "next/link";
import Spinner from "components/Spinner";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import TableHeader from "./components/TableHeader";
import StreamFilter from "components/StreamsTable/StreamFilter";
import { cn } from "lib/cn";

type Sort<T extends Record<string, unknown>> = {
  id: keyof T;
  desc: boolean;
};

export const DefaultSortBy: Sort<Record<string, unknown>> = {
  id: "createdAt",
  desc: true,
};

export const sortByToString = (sortBy: Sort<Record<string, unknown>>) =>
  `${sortBy.id}-${sortBy.desc}`;

type StateSetter<T extends Record<string, unknown>> = {
  setOrder: Dispatch<SetStateAction<string>>;
  setCursor: Dispatch<SetStateAction<string>>;
  setPrevCursors: Dispatch<SetStateAction<string[]>>;
  setNextCursor: Dispatch<SetStateAction<string>>;
  setFilters: Dispatch<SetStateAction<TFilter[]>>;
  setSelectedRows: Dispatch<SetStateAction<Row<T>[]>>;
  setDataCount: Dispatch<SetStateAction<number | number[]>>;
  setProjectId: Dispatch<SetStateAction<string>>;
};

export type State<T extends Record<string, unknown>> = {
  tableId: string;
  order: string;
  cursor: string;
  prevCursors: string[];
  nextCursor: string;
  filters: TFilter[];
  stringifiedFilters: string;
  selectedRows: Row<T>[];
  pageSize: number;
  dataCount: number | number[];
  projectId: string;
  invalidate: () => Promise<void>;
};

export type FetchResult<T extends Record<string, unknown>> = {
  rows: T[];
  nextCursor: string;
  count: number;

  // Only used in the StreamsTable component
  unHealtyStreamCount?: number;
  activeStreamCount?: number;
  allStreamCount?: number;
};

export type Fetcher<T extends Record<string, unknown>> = (
  state: State<T>,
) => Promise<FetchResult<T>>;

export type TableData<T extends Record<string, unknown>> = {
  isLoading: boolean;
  data: FetchResult<T>;
};

type Props<T extends Record<string, unknown>> = {
  columns: any;
  header?: React.ReactNode;
  title?: string;
  rowSelection?: "individual" | "all" | null;
  initialSortBy?: Sort<T>[];
  filterItems?: FilterItem[];
  showOverflow?: boolean;
  cursor?: string;
  selectAction?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  createAction?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  stateSetter: StateSetter<T>;
  state: State<T>;
  fetcher: Fetcher<T>;
  fetcherOptions?: UseQueryOptions<FetchResult<T>>;
  noPagination?: boolean;
  emptyState?: React.ReactNode;
  viewAll?: string;
  border?: boolean;
  tableLayout?: string;
};

type DataTableProps<T extends Record<string, unknown>> = Omit<
  Props<T>,
  "fetcher"
> & { tableData: TableData<T> };

export const DataTableComponent = <T extends Record<string, unknown>>({
  columns,
  header,
  title,
  rowSelection,
  initialSortBy,
  filterItems,
  showOverflow,
  cursor = "default",
  stateSetter,
  state,
  tableData,
  selectAction,
  createAction,
  emptyState,
  viewAll,
  noPagination = false,
  border = false,
  tableLayout = "fixed",
}: DataTableProps<T>) => {
  const { isLoading, data } = tableData;
  const dataMemo = useMemo(() => data?.rows ?? [], [data?.rows]);

  const someColumnCanSort = useMemo(() => {
    // To see if we show the sort help tooltip or not
    // @ts-ignore
    return columns.some((column) => !column.disableSortBy);
  }, [columns]);

  const getRowId = useCallback((row, relativeIndex) => {
    return row?.id ? row.id : relativeIndex;
  }, []);
  const {
    getTableProps,
    getTableBodyProps,
    prepareRow,
    headerGroups,
    rows,
    // @ts-ignore
    toggleAllRowsSelected,
    // @ts-ignore
    selectedFlatRows,
    // @ts-ignore
    state: { sortBy },
  } = useTable(
    {
      // @ts-ignore
      columns,
      getRowId,
      data: dataMemo,
      initialState: {
        // @ts-ignore
        pageSize: state.pageSize,
        pageIndex: 0,
        ...(initialSortBy ? { sortBy: initialSortBy } : undefined),
      },
      disableSortBy: !!viewAll,
      manualSortBy: false,
      autoResetFilters: false,
      autoResetSortBy: false,
      autoResetPage: false,
      autoResetSelectedRows: false,
    },
    useSortBy,
    useRowSelect,
    (hooks) => {
      if (rowSelection) {
        const isIndividualSelection = rowSelection === "individual";
        hooks.visibleColumns.push((columns) => [
          // Let's make a column for selection
          {
            id: "selection",
            width: 30,
            // The header can use the table's getToggleAllRowsSelectedProps method
            // to render a checkbox
            Header: ({
              // @ts-ignore
              getToggleAllRowsSelectedProps,
              // @ts-ignore
              isAllRowsSelected,
            }) => {
              if (isIndividualSelection) return null;
              const props = getToggleAllRowsSelectedProps();
              return (
                <Checkbox
                  placeholder="Select all rows"
                  className="flex"
                  onClick={props.onChange}
                  value="toggle-all"
                  checked={isAllRowsSelected ? true : false}
                />
              );
            },
            // The cell can use the individual row's getToggleRowSelectedProps method
            // to the render a checkbox
            Cell: ({ row }) => {
              return (
                <Checkbox
                  placeholder="Select row"
                  className="flex"
                  // @ts-ignore
                  value={row.isSelected}
                  // @ts-ignore
                  checked={row.isSelected}
                  onClick={() => {
                    isIndividualSelection && toggleAllRowsSelected(false);
                    // @ts-ignore
                    row.toggleRowSelected(!row.isSelected);
                  }}
                />
              );
            },
          },
          ...columns,
        ]);
      }
    },
  );
  useEffect(() => {
    stateSetter.setSelectedRows(selectedFlatRows);
    stateSetter.setDataCount([
      data?.allStreamCount,
      data?.activeStreamCount,
      data?.unHealtyStreamCount,
    ]);
  }, [selectedFlatRows, stateSetter.setSelectedRows]);

  useEffect(() => {
    const order = sortBy?.map((o) => sortByToString(o)).join(",") ?? "";
    stateSetter.setOrder(order);
  }, [sortBy, stateSetter.setOrder]);

  useEffect(() => {
    stateSetter.setNextCursor(data?.nextCursor);
  }, [data?.nextCursor, stateSetter.setNextCursor]);

  const handlePreviousPage = useCallback(() => {
    stateSetter.setNextCursor(state.cursor); // current cursor will be next
    const prevCursorsClone = [...state.prevCursors];
    const newCursor = prevCursorsClone.pop();
    stateSetter.setCursor(newCursor);
    stateSetter.setPrevCursors([...prevCursorsClone]);
  }, [
    stateSetter.setNextCursor,
    stateSetter.setCursor,
    stateSetter.setPrevCursors,
    state.prevCursors,
    state.cursor,
  ]);

  const handleNextPage = useCallback(() => {
    stateSetter.setPrevCursors((p) => [...p, state.cursor]);
    stateSetter.setCursor(state.nextCursor);
    stateSetter.setNextCursor("");
  }, [
    stateSetter.setPrevCursors,
    stateSetter.setCursor,
    stateSetter.setNextCursor,
    state.nextCursor,
    state.cursor,
  ]);

  const onSetFilters = (e) => {
    stateSetter.setCursor("");
    stateSetter.setPrevCursors([]);
    stateSetter.setFilters(e);
  };

  const headerCssWidth = (column, index, rowSelection): string => {
    return column.width || "auto";
  };

  const headerComponent = header ? (
    header
  ) : title ? (
    <TableHeader title={title} />
  ) : null;

  const isStreamsTable = state.tableId === "streamsTable";

  return (
    <>
      <Flex
        className={cn(
          "border-b mb-3 gap-3 border-transparent flex-col sm:flex-row sm:justify-between",
          border && "border-accent pb-2",
        )}>
        {/* Header title */}
        <Flex className="w-full flex-wrap flex-col">{headerComponent}</Flex>

        {/* Header actions */}
        <Flex className="sm:justify-between gap-2">
          {state.selectedRows.length ? (
            <Flex className="gap-2 items-center">
              <Flex className="gap-2 items-center">
                <Text variant="neutral" size="sm">
                  {state.selectedRows.length} selected
                </Text>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleAllRowsSelected(false)}>
                  Deselect
                </Button>
              </Flex>
              {selectAction && (
                <Button
                  // @ts-ignore
                  {...selectAction}
                  variant="secondary"
                />
              )}
            </Flex>
          ) : (
            <>
              {!isStreamsTable && (
                <>
                  {!viewAll && filterItems && (
                    <TableFilter
                      items={filterItems}
                      onDone={(e) => onSetFilters(e)}
                    />
                  )}
                </>
              )}
              {createAction && (
                <Button size="sm" variant="secondary" {...createAction} />
              )}
            </>
          )}
        </Flex>
      </Flex>
      {isLoading ? (
        <Flex className="items-center justify-center h-full">
          <Spinner />
        </Flex>
      ) : !data?.count ? (
        !JSON.parse(state.stringifiedFilters).length ? (
          emptyState
        ) : (
          <Flex className="flex-col justify-center h-full max-w-md mx-auto">
            <Heading css={{ fontWeight: 500, mb: "$3" }}>
              No results found
            </Heading>
            <Text variant="neutral">
              There aren't any results for that query.
            </Text>
          </Flex>
        )
      ) : (
        <Box>
          <Box className="overflow-x-auto">
            <Table className="min-w-[500px]" {...getTableProps()}>
              <Thead>
                {headerGroups.map((headerGroup) => (
                  <Tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column, i) => {
                      const withHelpTooltip =
                        someColumnCanSort &&
                        i === headerGroup.headers.length - 1;
                      return (
                        <Td
                          as={i === 0 ? Th : Td}
                          scope="col"
                          css={{
                            pl: i === 0 ? "$1" : 0,
                            pr: "$2",
                            width: headerCssWidth(column, i, rowSelection),
                          }}
                          {...column.getHeaderProps(
                            // @ts-ignore
                            column.getSortByToggleProps(),
                          )}>
                          <Flex
                            css={{
                              ai: "center",
                              mr: withHelpTooltip ? "$3" : 0,
                            }}>
                            <Box css={{ fontSize: "$2", whiteSpace: "nowrap" }}>
                              {column.render("Header")}
                            </Box>
                            {/*@ts-ignore */}
                            {column.canSort && (
                              <Box css={{ ml: "$2" }}>
                                {/* @ts-ignore */}
                                {column.isSorted
                                  ? // @ts-ignore
                                    column.isSortedDesc
                                    ? " ⭣"
                                    : " ⭡"
                                  : " ⭥"}
                              </Box>
                            )}
                          </Flex>
                        </Td>
                      );
                    })}
                  </Tr>
                ))}
              </Thead>
              <Tbody {...getTableBodyProps()}>
                {rows.map((row: Row<object>) => {
                  prepareRow(row);
                  return (
                    <Tr
                      className="hover:bg-accent cursor-pointer"
                      {...row.getRowProps()}>
                      {row.cells.map((cell, i) => (
                        <Td
                          as={i === 0 ? Th : Td}
                          css={{
                            pl: 0,
                            pr: "$2",
                            ...cell.value?.css,
                          }}
                          {...cell.getCellProps()}>
                          {cell.value?.href ? (
                            <Link
                              href={cell.value.href}
                              passHref
                              legacyBehavior>
                              <A
                                css={{
                                  cursor: "default",
                                  textDecoration: "none",
                                  py: "$2",
                                  pl: i === 0 ? "$1" : 0,
                                  display: "block",
                                  "&:hover": {
                                    textDecoration: "none",
                                  },
                                }}>
                                {cell.render("Cell")}
                              </A>
                            </Link>
                          ) : (
                            <Box css={{ py: "$2", pl: i === 0 ? "$1" : 0 }}>
                              {cell.render("Cell")}
                            </Box>
                          )}
                        </Td>
                      ))}
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
          {!noPagination && (
            <Flex className="justify-between items-center mt-4">
              <Text>
                <b>{data?.count}</b> {data?.count > 1 ? "results" : "result"}
              </Text>
              {viewAll ? (
                <Link href={viewAll} passHref legacyBehavior>
                  <A variant="primary" css={{ display: "flex", ai: "center" }}>
                    <Box>View all</Box> <ArrowRightIcon />
                  </A>
                </Link>
              ) : (
                <Flex className="gap-2 items-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePreviousPage}
                    disabled={state.prevCursors.length <= 0}>
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={
                      state.nextCursor === "" ||
                      // @ts-ignore
                      state.pageSize >= parseFloat(data?.count)
                    }>
                    Next
                  </Button>
                </Flex>
              )}
            </Flex>
          )}
        </Box>
      )}
    </>
  );
};

export const useTableState = <T extends Record<string, unknown>>({
  tableId,
  pageSize = 20,
  initialOrder,
}: {
  tableId: string;
  pageSize?: number;
  initialOrder?: string;
}) => {
  const [order, setOrder] = useState(initialOrder || "");
  const [cursor, setCursor] = useState("");
  const [prevCursors, setPrevCursors] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState("default");
  const [filters, setFilters] = useState<TFilter[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<Row<T>[]>([]);
  const [dataCount, setDataCount] = useState<number | number[]>(0);
  const queryClient = useQueryClient();

  const stringifiedFilters = useMemo(() => {
    const formatted = formatFiltersForApiRequest(filters);
    return JSON.stringify(formatted);
  }, [filters]);

  const stateSetter: StateSetter<T> = useMemo(
    () => ({
      setOrder,
      setCursor,
      setPrevCursors,
      setNextCursor,
      setFilters,
      setSelectedRows,
      setDataCount,
      setProjectId,
    }),
    [],
  );

  const state: State<T> = useMemo(
    () => ({
      tableId,
      order,
      cursor,
      prevCursors,
      nextCursor,
      filters,
      stringifiedFilters,
      selectedRows,
      pageSize,
      dataCount,
      projectId,
      invalidate: () => queryClient.invalidateQueries(tableId),
    }),
    [
      order,
      cursor,
      prevCursors,
      nextCursor,
      filters,
      stringifiedFilters,
      selectedRows,
      pageSize,
      dataCount,
      queryClient,
      tableId,
      projectId,
    ],
  );

  return { state, stateSetter };
};

const TableComponent = <T extends Record<string, unknown>>(props: Props<T>) => {
  const { state, fetcher, fetcherOptions } = props;
  const queryKey = [
    state.tableId,
    state.cursor,
    state.order,
    state.stringifiedFilters,
    state.projectId,
  ];
  const tableData: UseQueryResult<FetchResult<T>> = useQuery(
    queryKey,
    () => fetcher(state),
    fetcherOptions,
  );

  return DataTableComponent({ ...props, tableData });
};

export default TableComponent;
