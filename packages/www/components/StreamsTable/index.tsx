import Link from "next/link";
import ReactTooltip from "react-tooltip";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi, usePageVisibility } from "../../hooks";
import { Box, Button, Flex, Container, Link as A } from "@theme-ui/components";
import DeleteStreamModal from "../DeleteStreamModal";
import TableV2 from "../Table-v2";
import Help from "../../public/img/help.svg";
import { Stream } from "@livepeer.com/api";
import TextCell, { TextCellProps } from "components/Table-v2/cells/text";
import { Column, Row } from "react-table";
import DateCell, { DateCellProps } from "components/Table-v2/cells/date";
import {
  RenditionDetailsCellProps,
  RenditionsDetailsCell,
} from "components/Table-v2/cells/streams-table";
import { dateSort, stringSort } from "components/Table-v2/sorts";
import { SortTypeArgs } from "components/Table-v2/types";

type ProfileProps = {
  id: string;
  i: number;
  rendition: Rendition;
};

type Rendition = {
  width: number;
  name: string;
  height: number;
  bitrate: number;
  fps: number;
};

const Profile = ({
  id,
  i,
  rendition: { fps, name, width, height, bitrate },
}: ProfileProps) => {
  return (
    <Box
      id={`profile-${id}-${i}-${name}`}
      key={`profile-${id}-${i}-${name}`}
      sx={{
        padding: "0.5em",
        display: "grid",
        alignItems: "space-around",
        gridTemplateColumns: "auto auto",
      }}>
      <Box>name:</Box>
      <Box>{name}</Box>
      <Box>fps:</Box>
      <Box>{fps}</Box>
      <Box>width:</Box>
      <Box>{width}</Box>
      <Box>height:</Box>
      <Box>{height}</Box>
      <Box>bitrate:</Box>
      <Box>{bitrate}</Box>
    </Box>
  );
};

export const RenditionsDetails = ({ stream }: { stream: Stream }) => {
  let details = "";
  let detailsTooltip;
  if (stream.presets?.length) {
    details = `${stream.presets}`;
  }
  if (stream.profiles?.length) {
    if (details) {
      details += "/";
    }
    details += stream.profiles
      .map(({ height, fps }) => {
        if (fps === 0) {
          return `${height}pSourceFPS`;
        }
        return `${height}p${fps}`;
      })
      .join(",\u{200B}");
    detailsTooltip = (
      <Flex>
        {stream.profiles.map((p, i) => (
          <Profile key={i} id={stream.id} i={i} rendition={p} />
        ))}
      </Flex>
    );
    detailsTooltip = null; // remove for now, will be back later
  }
  return (
    <Flex>
      <Box>{details}</Box>
      {detailsTooltip ? (
        <Flex sx={{ alignItems: "center" }}>
          <Flex>
            <ReactTooltip
              id={`tooltip-details-${stream.id}`}
              className="tooltip"
              place="top"
              type="dark"
              effect="solid">
              {detailsTooltip}
            </ReactTooltip>
            <Help
              data-tip
              data-for={`tooltip-details-${stream.id}`}
              sx={{
                color: "muted",
                cursor: "pointer",
                ml: 1,
              }}
            />
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
};

type StreamsTableData = {
  id: string;
  name: TextCellProps;
  details: RenditionDetailsCellProps;
  created: DateCellProps;
  lastActive: DateCellProps;
  status: string;
};

const StreamsTable = ({ userId, id }: { userId: string; id: string }) => {
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedStreams, setSelectedStreams] = useState([]);
  const [streams, setStreams] = useState([]);
  const { getStreams, deleteStream, deleteStreams, getBroadcasters } = useApi();

  useEffect(() => {
    getStreams(userId)
      .then((streams) => setStreams(streams))
      .catch((err) => console.error(err)); // todo: surface this
  }, [userId, deleteModal]);

  const close = useCallback(() => {
    setDeleteModal(false);
  }, []);

  const isVisible = usePageVisibility();

  useEffect(() => {
    if (!isVisible) {
      return;
    }
    const interval = setInterval(() => {
      getStreams(userId)
        .then((streams) => setStreams(streams))
        .catch((err) => console.error(err)); // todo: surface this
    }, 5000);
    return () => clearInterval(interval);
  }, [userId, isVisible]);

  const columns: Column<StreamsTableData>[] = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name",
        Cell: TextCell,
        sortType: (...params: SortTypeArgs) => stringSort('original.name.children', ...params)
      },
      {
        Header: "Details",
        accessor: "details",
        Cell: RenditionsDetailsCell,
        disableSortBy: true,
      },
      {
        Header: "Created",
        accessor: "created",
        Cell: DateCell,
        sortType: (...params: SortTypeArgs) => dateSort('original.created.date', ...params)
      },
      {
        Header: "Last Active",
        accessor: "lastActive",
        Cell: DateCell,
        sortType: (...params: SortTypeArgs) => dateSort('original.lastActive.date', ...params)
      },
      {
        Header: "Status",
        accessor: "status",
        disableSortBy: true,
      },
    ],
    []
  );

  const data: StreamsTableData[] = useMemo(() => {
    return streams.map((stream) => {
      return {
        id: stream.id,
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
        created: { date: new Date(stream.createdAt), fallback: <i>unseen</i> },
        lastActive: {
          date: new Date(stream.lastSeen),
          fallback: <i>unseen</i>,
        },
        status: stream.isActive ? "Active" : "Idle",
      };
    });
  }, [streams]);

  const handleRowSelectionChange = useCallback(
    (rows: Row<StreamsTableData>[]) => {
      setSelectedStreams(
        rows.map((r) => streams.find((s) => s.id === r.original.id))
      );
    },
    [streams]
  );

  return (
    <Container sx={{ mb: 5 }} id={id}>
      {deleteModal && selectedStreams.length && (
        <DeleteStreamModal
          numStreamsToDelete={selectedStreams.length}
          streamName={selectedStreams[0].name}
          onClose={close}
          onDelete={() => {
            if (selectedStreams.length === 1) {
              deleteStream(selectedStreams[0].id).then(close);
            } else if (selectedStreams.length > 1) {
              deleteStreams(selectedStreams.map((s) => s.id)).then(close);
            }
          }}
        />
      )}
      <Flex sx={{ alignItems: "center", mb: 3 }}>
        <Box>
          <Link href="/app/stream/new-stream" passHref>
            <A variant="buttons.outlineSmall" sx={{ mr: 2 }}>
              Create
            </A>
          </Link>
          <Button
            variant="primarySmall"
            aria-label="Delete Stream button"
            disabled={!selectedStreams.length}
            onClick={() => selectedStreams.length && setDeleteModal(true)}>
            Delete
          </Button>
        </Box>
      </Flex>
      <TableV2
        columns={columns}
        data={data}
        config={{ rowSelection: "all" }}
        onRowSelectionChange={handleRowSelectionChange}
      />
    </Container>
  );
};

export default StreamsTable;
