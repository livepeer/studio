import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { uniqBy } from "lodash";
import { useApi } from "../../hooks";
import { Box, Button, Container } from "@theme-ui/components";
import DeleteStreamModal from "../DeleteStreamModal";
import Table, { FetchDataF } from "components/Table-v2";
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
  const { getAdminStreams, deleteStream, deleteStreams } = useApi();

  const [lastFetchData, setLastFetchData] = useState<{
    cursor?: string;
    filters?: string;
    sort?: string;
  }>();

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
    []
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

  const fetchData: FetchDataF<AdminStreamsTableData> = useCallback(
    async (filters, sortBy) => {
      const parsedSort = sortBy.map((o) => `${o.id}-${o.desc}`).join(",");
      const parsedFilters = filters ? JSON.stringify(filters) : undefined;

      let cursorToUse = lastFetchData?.cursor;
      if (
        lastFetchData?.filters !== parsedFilters ||
        lastFetchData?.sort !== parsedSort
      ) {
        // Reset cursor when filtering or sorting changes
        cursorToUse = undefined;
      }

      try {
        const [streams, nextCursor, resp] = await getAdminStreams(
          false,
          parsedSort,
          filters,
          ROWS_PER_PAGE,
          cursorToUse
        );
        if (resp.ok && Array.isArray(streams)) {
          setStreams((prev) => uniqBy([...prev, ...streams], "id"));
          setLastFetchData({
            cursor: nextCursor,
            filters: parsedFilters,
            sort: parsedSort,
          });
        } else {
          const errors = JSON.stringify(streams["errors"] || resp.statusText);
          console.error(errors);
        }
      } catch (error) {
        console.error(error);
      }
    },
    [getAdminStreams, streams, lastFetchData]
  );

  const refetch = useCallback(() => {
    // TODO pass last filter and sort data
    fetchData([], [], null);
  }, [fetchData]);

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
        fetchData={fetchData}
        columns={columns}
        data={data}
        pageSize={5}
        initialSortBy={[{ id: "created", desc: true }]}
        rowSelection={"all"}
        onRowSelectionChange={handleRowSelectionChange}
        filters={[
          {
            type: "checkbox",
            props: {
              label: "Show active only",
              columnId: "status",
              valueIfTrue: "active",
              valueIfFalse: undefined,
            },
          },
          {
            type: "text",
            props: { placeholder: "Filter by email", columnId: "userName" },
          },
        ]}
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
              onClick={() => setDeleteModal(true)}>
              Delete
            </Button>
          </>
        }
      />
    </Container>
  );
};

export default AdminStreamsTable;
