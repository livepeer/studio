import { useEffect, useState } from "react";
import Link from "next/link";
import { useApi, usePageVisibility } from "../../hooks";
import { Box, Button, Container, Flex } from "@theme-ui/components";
import DeleteStreamModal from "../DeleteStreamModal";
import { Table, TableRow, TableRowVariant, Checkbox } from "../Table";
import { RelativeTime, StreamName, RenditionsDetails } from "../StreamsTable";
import ReactTooltip from "react-tooltip";
import { UserName } from "../AdminTokenTable";
import { Stream, User } from "@livepeer.com/api";

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
        effect="solid"
      >
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

const sortNameF = (a: Stream, b: Stream) =>
  ((a && a.name) || "").localeCompare((b && b.name) || "");

const sortUserName = (users: Array<User>, a: Stream, b: Stream) => {
  const userA = users.find((u) => u.id === a.userId);
  const userB = users.find((u) => u.id === b.userId);
  if (userA && userB) {
    return userA.email.localeCompare(userB.email);
  }
  return ((a && a.name) || "").localeCompare((b && b.name) || "");
};

const sortUserIdF = (a: Stream, b: Stream) =>
  ((a && a.userId) || "").localeCompare((b && b.userId) || "");

const sortCreatedF = (a: Stream, b: Stream) =>
  (b.createdAt || 0) - (a.createdAt || 0);

const sortLastSeenF = (a: Stream, b: Stream) =>
  (b.lastSeen || 0) - (a.lastSeen || 0);

const sortActiveF = (a: Stream, b: Stream) =>
  +(b.isActive || false) - +(a.isActive || false);

export default ({ id }: { id: string }) => {
  const [broadcasters, setBroadcasters] = useState(null);
  const [activeOnly, setActiveOnly] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedStream, setSelectedStream] = useState(null);
  const [streams, setStreams] = useState([]);
  const [users, setUsers] = useState([]);
  const { getAdminStreams, deleteStream, getBroadcasters, getUsers } = useApi();
  const [sortFunc, setSortFunc] = useState(null);
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
      .then((streams) => {
        if (sortFunc) {
          streams.sort(sortFunc);
        }
        setStreams(streams);
      })
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
        .then((streams) => {
          if (sortFunc) {
            streams.sort(sortFunc);
          }
          setStreams(streams);
        })
        .catch((err) => console.error(err)); // todo: surface this
    }, 5000);
    return () => clearInterval(interval);
  }, [isVisible, sortFunc, activeOnly]);

  const sortUserId = () => {
    if (streams) {
      if (users) {
        streams.sort(sortUserName.bind(null, users));
        setSortFunc(() => sortUserName.bind(null, users));
      } else {
        streams.sort(sortUserIdF);
        setSortFunc(() => sortUserIdF);
      }
      setStreams([...streams]);
    }
  };
  const sortName = () => {
    if (streams) {
      streams.sort(sortNameF);
      setSortFunc(() => sortNameF);
      setStreams([...streams]);
    }
  };
  const sortCreated = () => {
    if (streams) {
      streams.sort(sortCreatedF);
      setSortFunc(() => sortCreatedF);
      setStreams([...streams]);
    }
  };
  const sortLastSeen = () => {
    if (streams) {
      streams.sort(sortLastSeenF);
      setSortFunc(() => sortLastSeenF);
      setStreams([...streams]);
    }
  };
  const sortActive = () => {
    if (streams) {
      streams.sort(sortActiveF);
      setSortFunc(() => sortActiveF);
      setStreams([...streams]);
    }
  };
  return (
    <Container
      id={id}
      sx={{
        mb: 5,
        mt: 2
      }}
    >
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
          as="/app/stream/new-stream"
        >
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
          onClick={() => selectedStream && setDeleteModal(true)}
        >
          Delete
        </Button>
        <Flex
          sx={{ display: "inline-flex", alignItems: "baseline", margin: 2 }}
          onClick={() => setActiveOnly(!activeOnly)}
        >
          <Checkbox value={activeOnly} />
          <Box sx={{ ml: "0.5em" }}> Show active only</Box>
        </Flex>
      </Box>
      <Table
        sx={{ gridTemplateColumns: "auto auto auto auto auto auto auto auto" }}
      >
        <TableRow variant={TableRowVariant.Header}>
          <Box></Box>
          <Box
            sx={{
              cursor: "pointer"
            }}
            onClick={sortUserId}
          >
            User name ⭥
          </Box>
          <Box
            sx={{
              cursor: "pointer"
            }}
            onClick={sortName}
          >
            Name ⭥
          </Box>
          <Box>Details</Box>
          <Box>Segments</Box>
          <Box
            sx={{
              cursor: "pointer"
            }}
            onClick={sortCreated}
          >
            Created ⭥
          </Box>
          <Box
            sx={{
              cursor: "pointer"
            }}
            onClick={sortLastSeen}
          >
            Last Active ⭥
          </Box>
          <Box
            sx={{
              cursor: "pointer"
            }}
            onClick={sortActive}
          >
            Status ⭥
          </Box>
        </TableRow>
        {streams.map((stream: Stream) => {
          const {
            id,
            name,
            lastSeen,
            sourceSegments,
            transcodedSegments,
            createdAt,
            isActive
          } = stream;
          const selected = selectedStream && selectedStream.id === id;
          return (
            <>
              <TableRow
                key={id}
                variant={TableRowVariant.Normal}
                selected={selected}
                onClick={() => {
                  if (selected) {
                    setSelectedStream(null);
                  } else {
                    setSelectedStream(stream);
                  }
                }}
              >
                <Checkbox value={selected} />
                <UserName id={stream.userId} users={users} />
                <StreamName stream={stream} admin={true} />
                <RenditionsDetails stream={stream} />
                <Segments stream={stream} />
                <RelativeTime
                  id={id}
                  prefix="createdat"
                  tm={createdAt}
                  swap={true}
                />
                <RelativeTime
                  id={id}
                  prefix="lastSeen"
                  tm={lastSeen}
                  swap={true}
                />
                <Box>{isActive ? "Active" : "Idle"}</Box>
              </TableRow>
            </>
          );
        })}
      </Table>
    </Container>
  );
};
