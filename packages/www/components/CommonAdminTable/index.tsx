import { keyframes } from "@emotion/core";
import moment from "moment";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { Box, Button, Flex, Input } from "@theme-ui/components";
import {
  useTable,
  useFilters,
  useSortBy,
  useAsyncDebounce,
  useRowSelect,
} from "react-table";
import Help from "../../public/img/help.svg";
import ReactTooltip from "react-tooltip";
import { User, Stream } from "@livepeer.com/api";

const loadingAnim = keyframes`
0% {
  width: 0%;
  left: 0.5%
}
49% {
  width: 99.5%;
  left: 0.5%
}
50% {
  left: 99.5%;
  width: 0%;
}
100% {
  left: 0.5%;
  width: 99.5%
}
`;

export const StreamName = ({
  stream,
  admin = false,
}: {
  stream: Stream;
  admin?: boolean;
}) => {
  const pid = `stream-name-${stream.id}-${name}`;
  const query = admin ? { admin: true } : {};
  return (
    <Box>
      {stream.createdByTokenName ? (
        <ReactTooltip
          id={pid}
          className="tooltip"
          place="top"
          type="dark"
          effect="solid">
          Created by token <b>{stream.createdByTokenName}</b>
        </ReactTooltip>
      ) : null}
      <Box data-tip data-for={pid}>
        <Link
          href={{ pathname: "/app/stream/[id]", query }}
          as={`/app/stream/${stream.id}`}>
          <a>{stream.name}</a>
        </Link>
      </Box>
    </Box>
  );
};

type RelativeTimeProps = {
  id: string;
  prefix: string;
  tm: number;
  swap?: boolean;
};

export const RelativeTime = ({
  id,
  prefix,
  tm,
  swap = false,
}: RelativeTimeProps) => {
  const idpref = `time-${prefix}-${id}`;
  let main = moment.unix(tm / 1000.0).fromNow();
  let toolTip = moment.unix(tm / 1000.0).format("LLL");
  if (swap) {
    const s = main;
    main = toolTip;
    toolTip = s;
  }
  return (
    <Box id={idpref} key={idpref}>
      {tm ? (
        <>
          <ReactTooltip
            id={`tooltip-${idpref}`}
            className="tooltip"
            place="top"
            type="dark"
            effect="solid">
            {toolTip}
          </ReactTooltip>
          <span data-tip data-for={`tooltip-${idpref}`}>
            {main}
          </span>
        </>
      ) : (
        <em>unseen</em>
      )}
    </Box>
  );
};

export const UserName = ({ user }: { user: User }) => {
  const tid = `tooltip-name-${user.id}`;
  return (
    <Box
      sx={{
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>
      <ReactTooltip
        id={tid}
        className="tooltip"
        place="top"
        type="dark"
        effect="solid">
        <span>{user.id}</span>
        <span>{user.firstName}</span>
        <span>{user.lastName}</span>
      </ReactTooltip>
      <span data-tip data-for={tid}>
        {user.email.includes("@")
          ? user.email.split("@").join("@\u{200B}")
          : user.email}
      </span>
    </Box>
  );
};

const Checkbox = ({
  value,
  onClick,
}: {
  value: boolean;
  onClick: Function;
}) => {
  return (
    <Flex
      sx={{ height: "100%", alignItems: "center", justifyContent: "center" }}
      onClick={onClick}>
      <Box
        sx={{
          width: "12px",
          height: "12px",
          backgroundColor: value ? "primary" : "transparent",
          borderWidth: "1px",
          borderRadius: "3px",
          borderStyle: "solid",
          borderColor: "primary",
        }}></Box>
    </Flex>
  );
};

function formatLastSeen(lastSeen) {
  let formattedLastSeen = <em>unused</em>;
  if (lastSeen) {
    formattedLastSeen = (
      <span>
        {new Date(lastSeen).toLocaleDateString()}&nbsp;
        {new Date(lastSeen).toLocaleTimeString()}
      </span>
    );
  }
  return formattedLastSeen;
}

function renderCell(cell) {
  switch (cell.column.id) {
    case "lastSeen":
      return (
        <RelativeTime
          id={`${cell.column.id}-${cell.row.id}`}
          prefix="lastSeen"
          tm={cell.value}
          swap={true}
        />
      );
    case "createdAt":
      return (
        <RelativeTime
          id={`${cell.column.id}-${cell.row.id}`}
          prefix="createdat"
          tm={cell.value}
          swap={true}
        />
      );
    case "user.email":
      return <UserName user={cell.row.original.user}></UserName>;
    default:
      return cell.render("Cell");
  }
}

type OnFetchDataArgs = {
  order: string;
  cursor: string;
  filters: Array<{ id: string; value: string }>;
};

type OnFetchData = (args: OnFetchDataArgs) => void;
type OnRowSelected = (row: any) => void;

type FilterDesc = {
  id: string;
  placeholder?: string;
  render?: Function;
};

type CommonAdminTableProps = {
  id?: string;
  loading: boolean;
  onFetchData: OnFetchData;
  onRowSelected: OnRowSelected;
  setNextCursor: (curosor: string) => void;
  columns: any;
  data: Array<any>;
  nextCursor: string;
  err: string;
  filtersDesc?: Array<FilterDesc>;
  rowsPerPage: Number;
  initialSortBy?: Array<{ id: string; desc: boolean }>;
  children: any;
};

const CommonAdminTable = ({
  id,
  loading,
  onFetchData,
  onRowSelected,
  setNextCursor,
  columns,
  data,
  nextCursor,
  err,
  filtersDesc,
  rowsPerPage,
  initialSortBy = [],
  children,
}: CommonAdminTableProps) => {
  const [cursor, setCursor] = useState("");
  const [prevCursor, setPrevCursor] = useState([]);

  const fetchDataDebounced = useAsyncDebounce(({ sortBy, cursor, filters }) => {
    let order;
    if (sortBy.length) {
      order = sortBy.map((o) => `${o.id}-${o.desc}`).join(",");
    }
    onFetchData({ order, cursor, filters });
  }, 1000);

  const dm = useMemo(() => data, [data]);

  const tableOptions: any = {
    columns,
    data: dm,
    manualFilters: true,
    autoResetSortBy: false,
    manualSortBy: true,
    maxMultiSortColCount: 2,
    initialState: { sortBy: initialSortBy },
  };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    selectedFlatRows,
    toggleAllRowsSelected,
    setFilter,
    state: { filters, sortBy },
    rows,
  }: any = useTable(
    tableOptions,
    useFilters,
    useSortBy,
    useRowSelect,
    (hooks) => {
      hooks.visibleColumns.push((columns) => [
        // Let's make a column for selection
        {
          id: "selection",
          // The header can use the table's getToggleAllRowsSelectedProps method
          // to render a checkbox
          Header: ({ rows }) => {
            return (
              <>
                <Button
                  variant="secondarySmall"
                  disabled={prevCursor.length === 0}
                  sx={{ margin: 0, padding: "2px", px: "4px" }}
                  onClick={() => {
                    setNextCursor(cursor);
                    setCursor(prevCursor.pop());
                    setPrevCursor([...prevCursor]);
                  }}>
                  ⭠
                </Button>
                <Button
                  variant="secondarySmall"
                  disabled={rows.length < rowsPerPage || nextCursor === ""}
                  sx={{ margin: 0, ml: 2, padding: "2px", px: "4px" }}
                  onClick={() => {
                    prevCursor.push(cursor);
                    setPrevCursor([...prevCursor]);
                    setCursor(nextCursor);
                    setNextCursor("");
                  }}>
                  ⭢
                </Button>
              </>
            );
          },
          // The cell can use the individual row's getToggleRowSelectedProps method
          // to the render a checkbox
          Cell: ({ row }) => (
            <div>
              <Checkbox
                // @ts-ignore
                value={row.isSelected}
                onClick={(e) => {
                  toggleAllRowsSelected(false);
                  // @ts-ignore
                  row.toggleRowSelected(!row.isSelected);
                }}
              />
            </div>
          ),
        },
        ...columns,
      ]);
    }
  );

  useEffect(() => {
    onRowSelected(selectedFlatRows[0]?.original);
  }, [selectedFlatRows]);

  useEffect(() => {
    setPrevCursor([]);
    setNextCursor("");
    setCursor("");
  }, [sortBy, filters]);

  useEffect(() => {
    fetchDataDebounced({ sortBy, cursor, filters });
  }, [sortBy, cursor, filters]);

  return (
    <Box
      id={id}
      sx={{
        mb: 0,
        mt: 0,
      }}>
      <Flex
        sx={{
          justifyContent: "flex-start",
          alignItems: "baseline",
          my: "1em",
        }}>
        {children}
        {filtersDesc.map((fd) => {
          if (typeof fd.render === "function") {
            return fd.render({
              value: (filters.find((o) => o.id === fd.id) || [])[0]?.value,
              setValue: (v) => setFilter(fd.id, v),
            });
          }
          return (
            <Input
              key={fd.id}
              sx={{ width: "10em", ml: "1em" }}
              label={`${fd.placeholder || fd.id} filter input`}
              value={(filters.find((o) => o.id === fd.id) || [])[0]?.value}
              onChange={(e) => setFilter(fd.id, e.target.value)}
              placeholder={fd.placeholder}></Input>
          );
        })}
      </Flex>
      {err && <Box>{err}</Box>}
      <Box>
        <table
          sx={{
            display: "table",
            width: "100%",
            borderCollapse: "inherit",
            borderSpacing: "0",
            border: 0,
          }}
          {...getTableProps()}>
          <thead sx={{ position: "relative" }}>
            {headerGroups.map((headerGroup, i) => (
              <tr key={i} {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column: any, i) => (
                  <th
                    sx={{
                      userSelect: "none",
                      fontWeight: "normal",
                      textTransform: "uppercase",
                      bg: "rgba(0,0,0,.03)",
                      borderBottom: "1px solid",
                      borderTop: "1px solid",
                      borderColor: "muted",
                      borderLeft: "0px solid",
                      borderRight: "0px solid",
                      fontSize: 0,
                      color: "gray",
                      py: 2,
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
                    }}
                    align="left"
                    {...column.getHeaderProps(
                      column.getSortByToggleProps({ title: "" })
                    )}
                    key={i}>
                    <Flex sx={{ mr: "-18px" }}>
                      {column.render("Header")}
                      <span>
                        {column.canSort &&
                          (column.isSorted
                            ? column.isSortedDesc
                              ? "⭣"
                              : "⭡"
                            : "⭥")}
                      </span>
                      {i === headerGroup.headers.length - 1 && (
                        <Flex
                          sx={{ alignItems: "center", ml: "auto", mr: "1em" }}>
                          <Flex>
                            <ReactTooltip
                              id={`tooltip-multiorder`}
                              className="tooltip"
                              place="top"
                              type="dark"
                              effect="solid">
                              To multi-sot (sort by two column simultaneously)
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
                          </Flex>
                        </Flex>
                      )}
                    </Flex>
                  </th>
                ))}
              </tr>
            ))}
            {loading && (
              <tr
                sx={{
                  height: "0px",
                  border: 0,
                  bg: "transparent !important",
                  margin: 0,
                  padding: 0,
                }}>
                <th
                  sx={{ border: 0, bg: "transparent", margin: 0, padding: 0 }}
                  colSpan={1000}>
                  <div sx={{ width: "100%", position: "relative" }}>
                    <div
                      sx={{
                        position: "absolute",
                        top: "-1px",
                        left: "6px",
                        right: "0px",
                      }}>
                      <div
                        sx={{
                          backgroundColor: "dodgerblue",
                          height: "1px",
                          animation: `${loadingAnim} 3s ease-in-out infinite`,
                        }}
                      />
                    </div>
                  </div>
                </th>
              </tr>
            )}
          </thead>

          <tbody {...getTableBodyProps()}>
            {rows.map((row: any, rowIndex) => {
              prepareRow(row);
              return (
                <tr
                  sx={{
                    bg: "transparent !important",
                  }}
                  {...row.getRowProps()}>
                  {row.cells.map((cell) => {
                    return (
                      <td
                        sx={{
                          fontSize: 1,
                          borderBottomColor: "muted",
                          borderBottomWidth: "1px",
                          borderBottomStyle: "solid",
                          borderTop: "0px solid",
                          borderLeft: "0px solid",
                          borderRight: "0px solid",
                        }}
                        {...cell.getCellProps()}>
                        {renderCell(cell)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </Box>
    </Box>
  );
};

export default CommonAdminTable;
