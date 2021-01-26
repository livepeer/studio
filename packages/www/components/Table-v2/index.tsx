import { Column, Row, usePagination, useSortBy, useTable } from "react-table";
import { useEffect, useMemo, useState } from "react";
import Paginator from "./paginator";

type Props<D extends Record<string, unknown>> = {
  columns: Column<D>[];
  data: D[];
  pageSize?: number;
};

const Table = <D extends Record<string, unknown>>({
  columns,
  data,
  pageSize = 100,
}: Props<D>) => {
  const [memoizedSortBy, setMemoizedSortBy] = useState([]);

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
    state: { pageIndex, sortBy },
    ...rest
  } = useTable(
    {
      // @ts-ignore
      columns,
      data,
      // @ts-ignore
      initialState: { pageSize, pageIndex: 0, sortBy: memoizedSortBy },
      manualSortBy: false,
    },
    useSortBy,
    usePagination
  );

  useEffect(() => {
    // A bit of a hack, to prevent the reseting of sortBy when new data arrives
    setMemoizedSortBy(sortBy);
  }, [sortBy]);

  const captionData = useMemo(() => {
    return { pageFirstRowIndex: 1 + pageSize * pageIndex };
  }, [pageIndex, pageSize]);

  return (
    <div>
      <div sx={{ overflow: "hidden" }}>
        <div className="overflow-x-auto" sx={{ overflowX: "auto" }}>
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
                  {headerGroup.headers.map((column) => (
                    <th
                      scope="col"
                      // @ts-ignore
                      {...column.getHeaderProps(column.getSortByToggleProps())}
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
                      {column.render("Header")}
                      {/*@ts-ignore */}
                      {column.isSorted
                        ? // @ts-ignore
                          column.isSortedDesc
                          ? " ⭣"
                          : " ⭡"
                        : ""}
                    </th>
                  ))}
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
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600"
                        sx={{
                          px: 4,
                          py: 3,
                          border: 0,
                          borderBottom: "1px solid",
                          borderBottomColor: "muted",
                          bg: "background",
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
          pageFirstRowIndex={captionData.pageFirstRowIndex}
          pageLastRowIndex={captionData.pageFirstRowIndex + page.length - 1}
          canPreviousPage={canPreviousPage}
          canNextPage={canNextPage}
          onPreviousPage={previousPage}
          onNextPage={nextPage}
          numberOfRows={data.length}
        />
      </div>
    </div>
  );
};

export default Table;
