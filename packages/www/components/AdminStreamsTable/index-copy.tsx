import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApi, usePageVisibility } from "../../hooks";
import { Box, Button, Container, Flex } from "@theme-ui/components";
import DeleteStreamModal from "../DeleteStreamModal";
import { Checkbox } from "../Table";
import TableV2 from "components/Table-v2";
import { Column } from "react-table";
import DateCell from "components/Table-v2/cells/date";
import {
  RenditionsDetailsCell,
  SegmentsCell,
  StreamNameCell,
  StreamNameCellProps,
  UserNameCell,
  UserNameCellProps,
  RenditionsDetailsCellProps,
  SegmentsCellProps,
} from "components/Table-v2/cells/admin-streams";

export type AdminStreamsTableData = {
  userName: UserNameCellProps;
  name: StreamNameCellProps;
  details: RenditionsDetailsCellProps;
  segments: SegmentsCellProps;
  created: Date;
  lastActive: Date;
  status: string;
};

export default ({ id }: { id: string }) => {
  const [broadcasters, setBroadcasters] = useState(null);
  const [activeOnly, setActiveOnly] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedStream, setSelectedStream] = useState(null);
  const [streams, setStreams] = useState([]);
  const [users, setUsers] = useState([]);
  const { getAdminStreams, deleteStream, getBroadcasters, getUsers } = useApi();

  useEffect(() => {
    getUsers(10000)
      .then((users) => {
        if (Array.isArray(users)) {
          setUsers(users[0]);
        } else {
          console.log(users);
        }
      })
      .catch((err) => console.error(err)); // todo: surface this
  }, []);

  useEffect(() => {
    getBroadcasters()
      .then((broadcasters) => setBroadcasters(broadcasters))
      .catch((err) => console.error(err)); // todo: surface this
  }, []);

  useEffect(() => {
    getAdminStreams(activeOnly)
      .then((streams) => setStreams(streams))
      .catch((err) => console.error(err)); // todo: surface this
  }, [deleteModal, activeOnly]);

  const close = () => {
    setDeleteModal(false);
    setSelectedStream(null);
  };

  const isVisible = usePageVisibility();

  useEffect(() => {
    if (!isVisible) {
      return;
    }
    const interval = setInterval(() => {
      getAdminStreams(activeOnly)
        .then((streams) => setStreams(streams))
        .catch((err) => console.error(err)); // todo: surface this
    }, 5000);
    return () => clearInterval(interval);
  }, [isVisible, activeOnly]);

  const columns: Column<AdminStreamsTableData>[] = useMemo(
    () => [
      {
        Header: "User Name",
        accessor: "userName",
        Cell: UserNameCell,
      },
      {
        Header: "Name",
        accessor: "name",
        Cell: StreamNameCell,
      },
      {
        Header: "Details",
        accessor: "details",
        Cell: RenditionsDetailsCell,
      },
      {
        Header: "Segments",
        accessor: "segments",
        Cell: SegmentsCell,
      },
      {
        Header: "Created At",
        accessor: "created",
        Cell: DateCell,
      },
      {
        Header: "Last Active",
        accessor: "lastActive",
        Cell: DateCell,
      },
      {
        Header: "Status",
        accessor: "status",
      },
    ],
    []
  );

  const data: AdminStreamsTableData[] = useMemo(() => {
    if (!streams) return [];
    return streams.map((stream) => {
      const cell: AdminStreamsTableData = {
        userName: { users, id: stream.userId },
        name: { stream, admin: true },
        details: { stream },
        segments: { stream },
        created: new Date(stream.createdAt),
        lastActive: new Date(stream.lastSeen),
        status: stream.isActive ? "Active" : "Idle",
      };
      return cell;
    });
  }, [streams]);

  return (
    <Container id={id} sx={{ mb: 5, mt: 2 }}>
      {deleteModal && selectedStream && (
        <DeleteStreamModal
          streamName={selectedStream.name}
          onClose={close}
          onDelete={() => {
            deleteStream(selectedStream.id).then(close);
          }}
        />
      )}
      <Box>
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
      </Box>
      <TableV2 columns={columns} data={data} />
    </Container>
  );
};
