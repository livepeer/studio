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
import ReactTooltip from "react-tooltip";
import {
  CheckboxFilter,
  CheckboxFilterProps,
  InputFilterProps,
  TextFilter,
} from "./filters/fields";
import { QuestionMarkIcon } from "@radix-ui/react-icons";
import { Box, Flex, Checkbox, styled } from "@livepeer.com/design-system";

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
};

const StyledQuestionMarkIcon = styled(QuestionMarkIcon, {
  color: "$hiContrast",
  cursor: "pointer",
  ml: "$1",
});

const Table = <T extends Record<string, unknown>>({
  columns,
  data,
  header,
  pageSize = 100,
  rowSelection,
  onRowSelectionChange,
  initialSortBy,
  filters,
  showOverflow,
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
            // @ts-ignore
            Header: ({ getToggleAllPageRowsSelectedProps }) => {
              const props = getToggleAllPageRowsSelectedProps();
              return isIndividualSelection ? null : (
                <Checkbox onClick={props.onChange} value={props.checked} />
              );
            },
            // The cell can use the individual row's getToggleRowSelectedProps method
            // to the render a checkbox
            Cell: ({ row }) => {
              return (
                <Checkbox
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
          <Box
            as="table"
            {...getTableProps()}
            css={{
              minWidth: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              color: "$hiContrast",
            }}>
            <thead>
              {headerGroups.map((headerGroup) => (
                <Box
                  as="tr"
                  {...headerGroup.getHeaderGroupProps()}
                  css={{ borderRadius: "8px" }}>
                  {headerGroup.headers.map((column, i) => {
                    const withHelpTooltip =
                      someColumnCanSort && i === headerGroup.headers.length - 1;
                    return (
                      <Box
                        as="th"
                        scope="col"
                        {...column.getHeaderProps(
                          // @ts-ignore
                          column.getSortByToggleProps()
                        )}
                        css={{
                          textTransform: "uppercase",
                          border: 0,
                          borderBottom: "1px solid",
                          borderTop: "0",
                          borderColor: "$slate6",
                          fontSize: "$1",
                          color: "$gray9",
                          fontWeight: 500,
                          px: "$4",
                          py: "$2",
                          position: "relative",
                        }}>
                        <Box
                          css={{
                            display: "flex",
                            alignItems: "center",
                            mr: withHelpTooltip ? "$3" : 0,
                          }}>
                          <Box css={{ whiteSpace: "nowrap" }}>
                            {column.render("Header")}
                          </Box>
                          {/*@ts-ignore */}
                          {column.canSort && (
                            <Box css={{ ml: 2 }}>
                              {/* @ts-ignore */}
                              {column.isSorted
                                ? // @ts-ignore
                                  column.isSortedDesc
                                  ? " ⭣"
                                  : " ⭡"
                                : " ⭥"}
                            </Box>
                          )}
                        </Box>
                        {withHelpTooltip && (
                          <Box
                            css={{
                              alignItems: "center",
                              display: "flex",
                              position: "absolute",
                              right: "$3",
                              top: "50%",
                              transform: "translateY(-50%)",
                            }}>
                            <ReactTooltip
                              id={`tooltip-multiorder`}
                              className="tooltip"
                              place="top"
                              type="dark"
                              effect="solid">
                              To multi-sort (sort by two column simultaneously)
                              hold shift while clicking on second column name.
                            </ReactTooltip>
                            <StyledQuestionMarkIcon
                              data-tip
                              data-for={`tooltip-multiorder`}
                            />
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {page.map((row: Row<object>) => {
                prepareRow(row);
                return (
                  <Box as="tr" {...row.getRowProps()}>
                    {row.cells.map((cell) => (
                      <Box
                        as="td"
                        {...cell.getCellProps()}
                        css={{
                          px: "$4",
                          py: "$2",
                          border: 0,
                          borderBottom: "1px solid",
                          borderBottomColor: "$slate6",
                          fontSize: "$2",
                        }}>
                        {cell.render("Cell")}
                      </Box>
                    ))}
                  </Box>
                );
              })}
            </tbody>
          </Box>
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

export default Table;
