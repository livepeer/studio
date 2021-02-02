import { useEffect, useState, useMemo } from "react";
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

const ROWS_PER_PAGE = 20;

function dur2str(dur?: number) {
  if (!dur) {
    return "";
  }
  if (dur < 120) {
    return `${dur.toFixed(2)} sec`;
  }
  const min = dur / 60;
  if (min < 12) {
    return `${min.toFixed(2)} min`;
  }
  const hour = min / 60;
  return `${hour.toFixed(2)} hours`;
}

const Segments = ({ stream }: { stream: Stream }) => {
  const idpref = `segments-${stream.id}`;
  return (
    <Box id={idpref} key={idpref}>
      <ReactTooltip
        id={`tooltip-${idpref}`}
        className="tooltip"
        place="top"
        type="dark"
        effect="solid">
        Source segments / Transcoded segments
      </ReactTooltip>
      <span data-tip data-for={`tooltip-${idpref}`}>
        {stream.sourceSegments || 0}/{stream.transcodedSegments || 0}
      </span>
      <br />
      <span>
        {dur2str(stream.sourceSegmentsDuration || 0)}/
        {dur2str(stream.transcodedSegmentsDuration || 0)}
      </span>
    </Box>
  );
};

const AdminStreamsTable = ({ id }: { id: string }) => {
  const [activeOnly, setActiveOnly] = useState(true);
  const [nonLivepeerOnly, setNonLivepeerOnly] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedStream, setSelectedStream] = useState(null);
  const [streams, setStreams] = useState([]);
  const [nextCursor, setNextCursor] = useState("");
  const [lastCursor, setLastCursor] = useState("");
  const [lastOrder, setLastOrder] = useState("");
  const [lastFilters, setLastFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");
  const { getAdminStreams, deleteStream } = useApi();

  const close = () => {
    setDeleteModal(false);
  };

  const columns: any = useMemo(
    () => [
      {
        Header: "ID",
        accessor: "id",
      },
      {
        Header: "User Name",
        accessor: "user.email",
      },
      {
        Header: "Name",
        accessor: "name",
        Cell: (cell) => {
          return <StreamName stream={cell.row.original} admin={true} />;
        },
      },
      {
        Header: "Details",
        accessor: "presets",
        disableSortBy: true,
        Cell: (cell) => {
          return <RenditionsDetails stream={cell.row.original} />;
        },
      },
      {
        Header: "Segments",
        accessor: "sourceSegments",
        Cell: (cell) => {
          return <Segments stream={cell.row.original} />;
        },
      },
      {
        Header: "Created",
        accessor: "createdAt",
      },
      {
        Header: "Last Active",
        accessor: "lastSeen",
      },
      {
        Header: "Status",
        accessor: "isActive",
        Cell: (cell) => {
          return cell.value ? "Active" : "Idle";
        },
      },
    ],
    [nextCursor, lastFilters]
  );

  const filtersDesc = useMemo(
    () => [
      { id: "id", placeholder: "Filter by ID" },
      { id: "user.email", placeholder: "Filter by email" },
    ],
    []
  );

  const fetchData = ({ order, cursor, filters }, refetch: boolean = false) => {
    setLoading(true);
    if (!refetch) {
      setLastCursor(cursor);
      setLastFilters(filters);
      setLastOrder(order);
    }
    getAdminStreams(
      activeOnly,
      order,
      filters,
      ROWS_PER_PAGE,
      cursor,
      nonLivepeerOnly
    )
      .then((result) => {
        const [users, nextCursor, resp] = result;
        if (resp.ok && Array.isArray(users)) {
          setLoadingError("");
          setNextCursor(nextCursor);
          setStreams(users);
        } else {
          const errors = JSON.stringify(users["errors"] || resp.statusText);
          setLoadingError(errors);
          console.error(errors);
        }
      })
      .catch((err) => {
        setLoadingError(`${err}`);
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  const refecth = () => {
    fetchData(
      { order: lastOrder, cursor: lastCursor, filters: lastFilters },
      true
    );
  };

  useEffect(() => {
    refecth();
  }, [activeOnly, nonLivepeerOnly]);

  return (
    <Container
      id={id}
      sx={{
        mb: 5,
        mt: 2,
      }}>
      {deleteModal && selectedStream && (
        <DeleteStreamModal
          streamName={selectedStream.name}
          onClose={close}
          onDelete={() => {
            deleteStream(selectedStream.id).then(refecth).finally(close);
          }}
        />
      )}
      <Box></Box>

      <CommonAdminTable
        onRowSelected={setSelectedStream}
        setNextCursor={setNextCursor}
        onFetchData={fetchData}
        loading={loading}
        data={streams}
        nextCursor={nextCursor}
        rowsPerPage={ROWS_PER_PAGE}
        err={loadingError}
        columns={columns}
        filtersDesc={filtersDesc}
        initialSortBy={[
          { id: "lastSeen", desc: true },
          { id: "createdAt", desc: true },
        ]}>
        <Link
          href={{ pathname: "/app/stream/new-stream", query: { admin: true } }}
          as="/app/stream/new-stream">
          <a>
            <Button variant="outlineSmall" sx={{ margin: 2 }}>
              Create
            </Button>
          </a>
        </Link>
        <Button
          variant="primarySmall"
          aria-label="Delete Stream button"
          disabled={!selectedStream}
          sx={{ margin: 2, mb: 4 }}
          onClick={() => selectedStream && setDeleteModal(true)}>
          Delete
        </Button>
        <Flex
          sx={{ display: "inline-flex", alignItems: "baseline", margin: 2 }}
          onClick={() => setActiveOnly(!activeOnly)}>
          <Checkbox value={activeOnly} />
          <Box sx={{ ml: "0.5em" }}> Show active only</Box>
        </Flex>
        <Flex
          sx={{ display: "inline-flex", alignItems: "baseline", margin: 2 }}
          onClick={() => setNonLivepeerOnly(!nonLivepeerOnly)}>
          <Checkbox value={nonLivepeerOnly} />
          <Box sx={{ ml: "0.5em" }}>
            {" "}
            Exclude streams from a Livepeer email address
          </Box>
        </Flex>
      </CommonAdminTable>
    </Container>
  );
};

export default AdminStreamsTable;
