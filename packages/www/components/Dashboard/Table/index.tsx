import {
  Column,
  Row,
  useFilters,
  usePagination,
  useRowSelect,
  useSortBy,
  useTable,
} from "react-table";
import { useEffect, useMemo, useCallback } from "react";
import Paginator from "./paginator";
import {
  CheckboxFilter,
  CheckboxFilterProps,
  InputFilterProps,
  TextFilter,
} from "./filters";
import { QuestionMarkIcon } from "@radix-ui/react-icons";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Flex,
  Checkbox,
  styled,
} from "@livepeer.com/design-system";

type FilterItem<Table extends Record<string, unknown>> =
  | { type: "text"; props: InputFilterProps<Table> }
  | { type: "checkbox"; props: CheckboxFilterProps<Table> };

type Sort<T extends Record<string, unknown>> = { id: keyof T; desc: boolean };
type Filter<T extends Record<string, unknown>> = { id: keyof T; value: any };
export type FetchDataF<T extends Record<string, unknown>> = (
  filters: Filter<T>[],
  sortBy: Sort<T>[],
  lastRow: Row<T> | null
) => void;

type Props<T extends Record<string, unknown>> = {
  columns: Column<T>[];
  data: T[];
  header?: React.ReactNode;
  rowSelection?: "individual" | "all" | null;
  pageSize?: number;
  onRowSelectionChange?: (rows: Row<T>[]) => void;
  initialSortBy?: Sort<T>[];
  filters?: FilterItem<T>[];
  showOverflow?: boolean;
  setOnUnselect?: any;
  cursor?: string;
};

const TableComponent = <T extends Record<string, unknown>>({
  columns,
  data,
  header,
  pageSize = 100,
  rowSelection,
  onRowSelectionChange,
  initialSortBy,
  filters,
  showOverflow,
  setOnUnselect,
  cursor = "default",
}: Props<T>) => {
  const someColumnCanSort = useMemo(() => {
    // To see if we show the sort help tooltip or not
    // @ts-ignore
    return columns.some((column) => !column.disableSortBy);
  }, [columns]);

  const getRowId = useCallback((row, relativeIndex, parent) => {
    return row?.id ? row.id : relativeIndex;
  }, []);

  const {
    getTableProps,
    getTableBodyProps,
    prepareRow,
    headerGroups,
    // @ts-ignore
    page,
    // @ts-ignore
    nextPage,
    // @ts-ignore
    previousPage,
    // @ts-ignore
    canPreviousPage,
    // @ts-ignore
    canNextPage,
    // @ts-ignore
    toggleAllRowsSelected,
    // @ts-ignore
    toggleAllPageRowsSelected,
    // @ts-ignore
    selectedFlatRows,
    // @ts-ignore
    setFilter,
    // @ts-ignore
    state: { filters: currentFilters },
  } = useTable(
    {
      // @ts-ignore
      columns,
      data,
      getRowId,
      initialState: {
        // @ts-ignore
        pageSize,
        pageIndex: 0,
        ...(initialSortBy ? { sortBy: initialSortBy } : undefined),
      },
      manualSortBy: false,
      autoResetFilters: false,
      autoResetSortBy: false,
      autoResetPage: false,
      autoResetSelectedRows: false,
    },
    useFilters,
    useSortBy,
    usePagination,
    useRowSelect,
    (hooks) => {
      if (rowSelection) {
        const isIndividualSelection = rowSelection === "individual";
        hooks.visibleColumns.push((columns) => [
          // Let's make a column for selection
          {
            id: "selection",
            // The header can use the table's getToggleAllRowsSelectedProps method
            // to render a checkbox
            Header: ({
              // @ts-ignore
              getToggleAllPageRowsSelectedProps,
              // @ts-ignore
              isAllRowsSelected,
            }) => {
              const props = getToggleAllPageRowsSelectedProps();
              return isIndividualSelection ? null : (
                <Checkbox
                  css={{ display: "flex" }}
                  onClick={props.onChange}
                  value={props.checked}
                  checked={isAllRowsSelected ? true : false}
                />
              );
            },
            // The cell can use the individual row's getToggleRowSelectedProps method
            // to the render a checkbox
            Cell: ({ row }) => {
              return (
                <Checkbox
                  css={{ display: "flex" }}
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
    }
  );

  useEffect(() => {
    if (setOnUnselect) {
      const onUnSelect = () => {
        toggleAllPageRowsSelected(false);
      };

      setOnUnselect(() => onUnSelect);
    }
  }, [toggleAllPageRowsSelected]);

  useEffect(() => {
    onRowSelectionChange?.(selectedFlatRows);
  }, [selectedFlatRows, onRowSelectionChange]);

  return (
    <Box>
      {header || filters ? (
        <Flex
          align="center"
          justify="between"
          css={{
            mb: "$3",
          }}>
          <Box>{header}</Box>
          {filters ? (
            <Flex
              align="center"
              justify="end"
              css={{
                flex: "1",
              }}>
              {filters.map((f) => {
                let filter: JSX.Element;
                switch (f.type) {
                  case "text":
                    filter = (
                      <TextFilter
                        {...f.props}
                        setFilter={setFilter}
                        currentFilters={currentFilters}
                      />
                    );
                    break;
                  case "checkbox":
                    filter = (
                      <CheckboxFilter
                        {...f.props}
                        setFilter={setFilter}
                        currentFilters={currentFilters}
                      />
                    );
                    break;
                  default:
                    return null;
                }
                return (
                  <Box
                    key={`${f.type}-${f.props.columnId}`}
                    css={{ ":not(:last-of-type)": { mr: "$3" } }}>
                    {filter}
                  </Box>
                );
              })}
            </Flex>
          ) : null}
        </Flex>
      ) : null}
      <Box css={{ overflow: showOverflow ? "visible" : "hidden" }}>
        <Box css={{ overflowX: showOverflow ? "visible" : "auto" }}>
          <Table
            {...getTableProps()}
            css={{
              minWidth: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              tableLayout: "initial",
            }}>
            <Thead>
              {headerGroups.map((headerGroup) => (
                <Tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column, i) => {
                    const withHelpTooltip =
                      someColumnCanSort && i === headerGroup.headers.length - 1;
                    return (
                      <Td
                        as={i === 0 ? Th : Td}
                        scope="col"
                        css={{
                          pl: i === 0 ? "$1" : 0,
                        }}
                        {...column.getHeaderProps(
                          // @ts-ignore
                          column.getSortByToggleProps()
                        )}>
                        <Flex
                          css={{
                            ai: "center",
                            mr: withHelpTooltip ? "$3" : 0,
                          }}>
                          <Box css={{ whiteSpace: "nowrap" }}>
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
              {page.map((row: Row<object>) => {
                prepareRow(row);
                return (
                  <Tr
                    css={{
                      "&:hover": {
                        backgroundColor: "$mauve2",
                        cursor,
                      },
                    }}
                    {...row.getRowProps()}>
                    {row.cells.map((cell, i) => (
                      <Td
                        as={i === 0 ? Th : Td}
                        css={{ pl: i === 0 ? "$1" : 0 }}
                        {...cell.getCellProps()}>
                        {cell.render("Cell")}
                      </Td>
                    ))}
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
        <Paginator
          canPreviousPage={canPreviousPage}
          canNextPage={canNextPage}
          onPreviousPage={previousPage}
          onNextPage={nextPage}
        />
      </Box>
    </Box>
  );
};

export default TableComponent;
