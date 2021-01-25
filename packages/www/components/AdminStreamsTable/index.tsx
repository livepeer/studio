import { useEffect, useState } from "react";
import Link from "next/link";
import { useApi, usePageVisibility } from "../../hooks";
import { Box, Button, Container, Flex } from "@theme-ui/components";
import DeleteStreamModal from "../DeleteStreamModal";
import {
  Table,
  TableRow,
  TableRowVariant,
  Checkbox,
  SortOrder,
  TableHead,
} from "../Table";
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

type SortFWithOrder = (a: Stream, b: Stream, order: SortOrder) => number;
type SortF = (a: Stream, b: Stream, order: SortOrder) => number;

/**
 * Helper for adding the `order` param to the passed sort function
 */
const getSortF = (order: SortOrder, sortFWithOrder: SortFWithOrder) => {
  const f: SortF = (a, b) => sortFWithOrder(a, b, order);
  return f;
};

const sortUserName = (
  users: Array<User>,
  a: Stream,
  b: Stream,
  order: SortOrder
) => {
  const userA = users.find((u) => u.id === a.userId);
  const userB = users.find((u) => u.id === b.userId);
  if (userA && userB) {
    return order === "asc"
      ? userB.email.localeCompare(userA.email)
      : userA.email.localeCompare(userB.email);
  }
  const aItem = (a && a.name) || "";
  const bItem = (b && b.name) || "";
  return order === "asc"
    ? bItem.localeCompare(aItem)
    : aItem.localeCompare(bItem);
};

const sortNameF: SortFWithOrder = (a, b, order) => {
  const aItem = (a && a.name) || "";
  const bItem = (b && b.name) || "";
  return order === "asc"
    ? bItem.localeCompare(aItem)
    : aItem.localeCompare(bItem);
};

const sortUserIdF: SortFWithOrder = (a, b, order) => {
  const aItem = (a && a.userId) || "";
  const bItem = (b && b.userId) || "";
  return order === "asc"
    ? bItem.localeCompare(aItem)
    : aItem.localeCompare(bItem);
};

const sortCreatedF: SortFWithOrder = (a, b, order) => {
  const aItem = b.createdAt || 0;
  const bItem = a.createdAt || 0;
  return order === "asc" ? bItem - aItem : aItem - bItem;
};

const sortLastSeenF: SortFWithOrder = (a, b, order) => {
  const aItem = b.lastSeen || 0;
  const bItem = a.lastSeen || 0;
  return order === "asc" ? bItem - aItem : aItem - bItem;
};

const sortActiveF: SortFWithOrder = (a, b, order) => {
  const aItem = +(b.isActive || false);
  const bItem = +(a.isActive || false);
  return order === "asc" ? bItem - aItem : aItem - bItem;
};

export default ({ id }: { id: string }) => {
  const [broadcasters, setBroadcasters] = useState(null);
  const [activeOnly, setActiveOnly] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedStream, setSelectedStream] = useState(null);
  const [streams, setStreams] = useState([]);
  const [users, setUsers] = useState([]);
  const { getAdminStreams, deleteStream, getBroadcasters, getUsers } = useApi();
  const [sortFunc, setSortFunc] = useState(null);
  const [activeSort, setActiveSort] = useState("");

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

  const sortUserId = (order: SortOrder) => {
    if (streams) {
      if (users) {
        streams.sort((a, b) => sortUserName(users, a, b, order));
        setSortFunc(() => getSortF(order, sortUserName.bind(null, users)));
      } else {
        streams.sort((a, b) => sortUserIdF(a, b, order));
        setSortFunc(() => getSortF(order, sortUserIdF));
      }
      setStreams([...streams]);
    }
  };
  const sortName = (order: SortOrder) => {
    if (streams) {
      streams.sort((a, b) => sortNameF(a, b, order));
      setSortFunc(() => getSortF(order, sortNameF));
      setStreams([...streams]);
    }
  };
  const sortCreated = (order: SortOrder) => {
    if (streams) {
      streams.sort((a, b) => sortCreatedF(a, b, order));
      setSortFunc(() => getSortF(order, sortCreatedF));
      setStreams([...streams]);
    }
  };
  const sortLastSeen = (order: SortOrder) => {
    if (streams) {
      streams.sort((a, b) => sortLastSeenF(a, b, order));
      setSortFunc(() => getSortF(order, sortLastSeenF));
      setStreams([...streams]);
    }
  };
  const sortActive = (order: SortOrder) => {
    if (streams) {
      streams.sort((a, b) => sortActiveF(a, b, order));
      setSortFunc(() => getSortF(order, sortActiveF));
      setStreams([...streams]);
    }
  };

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
      <Table
        sx={{ gridTemplateColumns: "auto auto auto auto auto auto auto auto" }}>
        <TableRow variant={TableRowVariant.Header}>
          <Box></Box>
          <TableHead
            onSort={(order) => {
              setActiveSort("user-name");
              sortUserId(order);
            }}
            isActiveSort={activeSort === "user-name"}>
            User Name
          </TableHead>
          <TableHead
            onSort={(order) => {
              setActiveSort("name");
              sortName(order);
            }}
            isActiveSort={activeSort === "name"}>
            Name
          </TableHead>
          <TableHead>Details</TableHead>
          <TableHead>Segments</TableHead>
          <TableHead
            onSort={(order) => {
              setActiveSort("created");
              sortCreated(order);
            }}
            isActiveSort={activeSort === "created"}>
            Created
          </TableHead>
          <TableHead
            onSort={(order) => {
              setActiveSort("last-active");
              sortLastSeen(order);
            }}
            isActiveSort={activeSort === "last-active"}>
            Last Active
          </TableHead>
          <TableHead
            onSort={(order) => {
              setActiveSort("status");
              sortActive(order);
            }}
            isActiveSort={activeSort === "status"}>
            Status
          </TableHead>
        </TableRow>
        {streams.map((stream: Stream) => {
          const {
            id,
            name,
            lastSeen,
            sourceSegments,
            transcodedSegments,
            createdAt,
            isActive,
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
                }}>
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
