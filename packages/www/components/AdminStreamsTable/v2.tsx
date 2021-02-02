import {
  useEffect,
  useState,
  useMemo,
  ComponentProps,
  useCallback,
} from "react";
import Link from "next/link";
import { useApi, usePageVisibility } from "../../hooks";
import { Box, Button, Container, Flex } from "@theme-ui/components";
import DeleteStreamModal from "../DeleteStreamModal";
import { Checkbox } from "../Table";
import { RenditionsDetails } from "../StreamsTable";
import ReactTooltip from "react-tooltip";
import { Stream } from "@livepeer.com/api";
import CommonAdminTable from "../CommonAdminTable";
import { StreamName } from "../CommonAdminTable";
import Table from "components/Table-v2";
import TextCell, { TextCellProps } from "components/Table-v2/cells/text";
import {
  WithStreamProps,
  RenditionsDetailsCell,
  SegmentsCell,
} from "components/Table-v2/cells/streams-table";
import DateCell, { DateCellProps } from "components/Table-v2/cells/date";
import { Column, Row } from "react-table";
import { SortTypeArgs } from "components/Table-v2/types";
import { dateSort, stringSort } from "components/Table-v2/sorts";
import { Input } from "@theme-ui/components";

const ROWS_PER_PAGE = 20;

type AdminStreamsTableData = {
  id: string;
  userName: string;
  name: TextCellProps;
  details: WithStreamProps;
  sourceSegments: WithStreamProps;
  created: DateCellProps;
  lastActive: DateCellProps;
  status: string;
};

const AdminStreamsTable = ({ id }: { id: string }) => {
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedStreams, setSelectedStreams] = useState([]);
  const [streams, setStreams] = useState([]);
  const [nextCursor, setNextCursor] = useState("");
  const [lastCursor, setLastCursor] = useState("");
  const [lastOrder, setLastOrder] = useState("");
  const [lastFilters, setLastFilters] = useState([]);
  const { getAdminStreams, deleteStream, deleteStreams } = useApi();

  const close = useCallback(() => {
    setDeleteModal(false);
  }, []);

  const columns: Column<AdminStreamsTableData>[] = useMemo(
    () => [
      {
        Header: "Stream Id",
        accessor: "id",
        disableSortBy: true,
      },
      {
        Header: "User Name",
        accessor: "userName",
      },
      {
        Header: "Name",
        accessor: "name",
        Cell: TextCell,
        sortType: (...params: SortTypeArgs) =>
          stringSort("original.name.children", ...params),
      },
      {
        Header: "Details",
        accessor: "details",
        Cell: RenditionsDetailsCell,
        disableSortBy: true,
      },
      {
        Header: "Segments",
        accessor: "sourceSegments",
        Cell: SegmentsCell,
      },
      {
        Header: "Created",
        accessor: "created",
        Cell: DateCell,
        sortType: (...params: SortTypeArgs) =>
          dateSort("original.created.date", ...params),
      },
      {
        Header: "Last Active",
        accessor: "lastActive",
        Cell: DateCell,
        sortType: (...params: SortTypeArgs) =>
          dateSort("original.lastActive.date", ...params),
      },
      {
        Header: "Status",
        accessor: "status",
        disableSortBy: true,
      },
    ],
    [nextCursor, lastFilters]
  );

  const data: AdminStreamsTableData[] = useMemo(() => {
    return streams.map((stream) => {
      return {
        id: stream.id,
        userName: stream.user.email,
        name: {
          children: stream.name,
          tooltipChildren: stream.createdByTokenName ? (
            <>
              Created by token <b>{stream.createdByTokenName}</b>
            </>
          ) : null,
          href: `/app/stream/${stream.id}`,
        },
        details: { stream },
        sourceSegments: { stream },
        created: { date: new Date(stream.createdAt), fallback: <i>unseen</i> },
        lastActive: {
          date: new Date(stream.lastSeen),
          fallback: <i>unseen</i>,
        },
        status: stream.isActive ? "Active" : "Idle",
      };
    });
  }, [streams]);

  const fetchData = useCallback(
    ({ order, cursor, filters }, refetch: boolean = false) => {
      if (!refetch) {
        setLastCursor(cursor);
        setLastFilters(filters);
        setLastOrder(order);
      }
      getAdminStreams(false, order, filters, ROWS_PER_PAGE, cursor)
        .then((result) => {
          const [users, nextCursor, resp] = result;
          if (resp.ok && Array.isArray(users)) {
            setNextCursor(nextCursor);
            setStreams(users);
          } else {
            const errors = JSON.stringify(users["errors"] || resp.statusText);
            console.error(errors);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    },
    [getAdminStreams]
  );

  const refetch = useCallback(() => {
    fetchData(
      { order: lastOrder, cursor: lastCursor, filters: lastFilters },
      true
    );
  }, [fetchData]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleRowSelectionChange = useCallback(
    (rows: Row<AdminStreamsTableData>[]) => {
      setSelectedStreams(
        rows.map((r) => streams.find((s) => s.id === r.original.id))
      );
    },
    [streams]
  );

  return (
    <Container
      id={id}
      sx={{
        mb: 5,
        mt: 2,
      }}>
      {deleteModal && selectedStreams.length && (
        <DeleteStreamModal
          numStreamsToDelete={selectedStreams.length}
          streamName={selectedStreams[0].name}
          onClose={close}
          onDelete={async () => {
            try {
              if (selectedStreams.length === 1) {
                await deleteStream(selectedStreams[0].id);
                refetch();
              } else if (selectedStreams.length > 1) {
                await deleteStreams(selectedStreams.map((s) => s.id));
                refetch();
              }
            } catch (error) {
              console.error(error);
            } finally {
              close();
            }
          }}
        />
      )}
      <Box sx={{ mt: 3 }} />
      <Table
        columns={columns}
        data={data}
        config={{
          pageSize: 5,
          initialSortBy: [{ id: "created", desc: true }],
          rowSelection: "all",
          onRowSelectionChange: handleRowSelectionChange,
          filters: [
            ({ setFilter, currentFilters }) => {
              const isChecked =
                currentFilters?.find((f) => f.id === "status")?.value ===
                "active";
              return (
                <Flex
                  sx={{ display: "inline-flex", alignItems: "baseline", mr: 3 }}
                  onClick={() =>
                    setFilter("status", isChecked ? undefined : "active")
                  }>
                  <Checkbox value={isChecked} />
                  <Box
                    sx={{ ml: "0.5em", userSelect: "none", cursor: "default" }}>
                    Show active only
                  </Box>
                </Flex>
              );
            },
            ({ setFilter, currentFilters }) => (
              <div>
                <Input
                  sx={{ width: "100%", maxWidth: "300px" }}
                  placeholder="Filter by email"
                  value={
                    currentFilters?.find((f) => f.id === "userName")?.value ??
                    ""
                  }
                  onChange={(e) => setFilter("userName", e.target.value)}
                />
              </div>
            ),
          ],
        }}
        header={
          <>
            <Link
              href={{
                pathname: "/app/stream/new-stream",
                query: { admin: true },
              }}
              as="/app/stream/new-stream">
              <a>
                <Button variant="outlineSmall" sx={{}}>
                  Create
                </Button>
              </a>
            </Link>
            <Button
              variant="primarySmall"
              aria-label="Delete Stream button"
              disabled={!selectedStreams.length}
              sx={{ ml: 3 }}
              onClick={() => selectedStreams.length && setDeleteModal(true)}>
              Delete
            </Button>
          </>
        }
      />
    </Container>
  );
};

export default AdminStreamsTable;
