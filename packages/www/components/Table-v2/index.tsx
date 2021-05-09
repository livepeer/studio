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
import Help from "../../public/img/help.svg";
import Checkbox from "components/Checkbox";
import {
  CheckboxFilter,
  CheckboxFilterProps,
  InputFilterProps,
  TextFilter,
} from "./filters";

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
    <div>
      {header || filters ? (
        <div
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}>
          <div>{header}</div>
          {filters ? (
            <div
              sx={{
                flex: "1",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
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
                  <div
                    key={`${f.type}-${f.props.columnId}`}
                    sx={{ ":not(:last-of-type)": { mr: 3 } }}>
                    {filter}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
      <div sx={{ overflow: showOverflow ? "visible" : "hidden" }}>
        <div sx={{ overflowX: showOverflow ? "visible" : "auto" }}>
          <table
            {...getTableProps()}
            sx={{
              minWidth: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
            }}>
            <thead>
              {headerGroups.map((headerGroup) => (
                <tr
                  {...headerGroup.getHeaderGroupProps()}
                  sx={{ borderRadius: "8px" }}>
                  {headerGroup.headers.map((column, i) => {
                    const withHelpTooltip =
                      someColumnCanSort && i === headerGroup.headers.length - 1;
                    return (
                      <th
                        scope="col"
                        {...column.getHeaderProps(
                          // @ts-ignore
                          column.getSortByToggleProps()
                        )}
                        sx={{
                          textTransform: "uppercase",
                          bg: "rgba(0,0,0,.03)",
                          border: 0,
                          borderBottom: "1px solid",
                          borderTop: "1px solid",
                          borderColor: "muted",
                          fontSize: 0,
                          color: "gray",
                          px: 4,
                          py: 2,
                          fontWeight: 400,
                          position: "relative",
                          "&:first-of-type": {
                            borderLeft: "1px solid",
                            borderColor: "muted",
                            borderTopLeftRadius: 6,
                            borderBottomLeftRadius: 6,
                          },
                          "&:last-of-type": {
                            borderRight: "1px solid",
                            borderColor: "muted",
                            borderTopRightRadius: 6,
                            borderBottomRightRadius: 6,
                          },
                        }}>
                        <div
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mr: withHelpTooltip ? 3 : 0,
                          }}>
                          <span sx={{ whiteSpace: "nowrap" }}>
                            {column.render("Header")}
                          </span>
                          {/*@ts-ignore */}
                          {column.canSort && (
                            <span sx={{ ml: 2 }}>
                              {/* @ts-ignore */}
                              {column.isSorted
                                ? // @ts-ignore
                                  column.isSortedDesc
                                  ? " ⭣"
                                  : " ⭡"
                                : " ⭥"}
                            </span>
                          )}
                        </div>
                        {withHelpTooltip && (
                          <div
                            sx={{
                              alignItems: "center",
                              display: "flex",
                              position: "absolute",
                              right: 3,
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
                            <Help
                              data-tip
                              data-for={`tooltip-multiorder`}
                              sx={{
                                cursor: "pointer",
                                ml: 1,
                              }}
                            />
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {page.map((row: Row<object>) => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()}>
                    {row.cells.map((cell) => (
                      <td
                        {...cell.getCellProps()}
                        sx={{
                          px: 4,
                          py: 3,
                          border: 0,
                          borderBottom: "1px solid",
                          borderBottomColor: "muted",
                          bg: "background",
                          fontSize: 1,
                        }}>
                        {cell.render("Cell")}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Paginator
          canPreviousPage={canPreviousPage}
          canNextPage={canNextPage}
          onPreviousPage={previousPage}
          onNextPage={nextPage}
        />
      </div>
    </div>
  );
};

export default Table;
