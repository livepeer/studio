import {
  Heading,
  Box,
  Flex,
  Link as A,
  Badge,
  styled,
} from "@livepeer.com/design-system";
import Link from "next/link";
import ReactTooltip from "react-tooltip";
import { useCallback, useMemo, useState } from "react";
import { useApi } from "../../../hooks";
import DeleteStreamModal from "../DeleteStreamModal";
import Table from "components/Dashboard/Table";
import TableFilter, {
  FilterItem,
  useTableFilters,
} from "components/Dashboard/Table/filters";
import { Stream } from "@livepeer.com/api";
import TextCell, { TextCellProps } from "components/Dashboard/Table/cells/text";
import { Column, Row } from "react-table";
import DateCell, { DateCellProps } from "components/Dashboard/Table/cells/date";
import { RenditionDetailsCellProps } from "components/Dashboard/Table/cells/streams-table";
import { dateSort, stringSort } from "components/Dashboard/Table/sorts";
import { SortTypeArgs } from "components/Dashboard/Table/types";
import { QuestionMarkIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import CreateStream from "./CreateStream";
import useSWR from "swr";

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

const filterItems: FilterItem[] = [
  { label: "Stream name", type: "text" },
  { label: "Created date", type: "date" },
  { label: "Last active", type: "date" },
  { label: "Lifetime duration", type: "text" },
];

const StyledQuestionMarkIcon = styled(QuestionMarkIcon, {
  color: "$gray8",
  cursor: "pointer",
  ml: "$1",
});

const Profile = ({
  id,
  i,
  rendition: { fps, name, width, height, bitrate },
}: ProfileProps) => {
  return (
    <Box
      id={`profile-${id}-${i}-${name}`}
      key={`profile-${id}-${i}-${name}`}
      css={{
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
        <Flex css={{ alignItems: "center" }}>
          <Flex>
            <ReactTooltip
              id={`tooltip-details-${stream.id}`}
              className="tooltip"
              place="top"
              type="dark"
              effect="solid">
              {detailsTooltip}
            </ReactTooltip>
            <StyledQuestionMarkIcon
              data-tip
              data-for={`tooltip-details-${stream.id}`}
              css={{
                color: "$slate7",
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

const page = 0;

const StreamsTable = ({
  title = "Streams",
  userId,
}: {
  title: string;
  userId: string;
}) => {
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedStreams, setSelectedStreams] = useState([]);
  const { getStreams, deleteStream, deleteStreams, getBroadcasters } = useApi();
  const { onDone, stringifiedFilters } = useTableFilters();

  const close = useCallback(() => {
    setDeleteModal(false);
  }, []);

  const columns: Column<StreamsTableData>[] = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name",
        Cell: TextCell,
        sortType: (...params: SortTypeArgs) =>
          stringSort("original.name.children", ...params),
      },
      // {
      //   Header: "Details",
      //   accessor: "details",
      //   Cell: RenditionsDetailsCell,
      //   disableSortBy: true,
      // },
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

  const { data } = useSWR([page, stringifiedFilters], async () => {
    const streams = await getStreams(userId, {
      page,
      pageSize: 2,
      filters: stringifiedFilters,
    });
    return streams.map((stream) => {
      return {
        id: stream.id,
        name: {
          id: stream.id,
          children: stream.name,
          tooltipChildren: stream.createdByTokenName ? (
            <>
              Created by token <b>{stream.createdByTokenName}</b>
            </>
          ) : null,
          href: `/dashboard/streams/${stream.id}`,
        },
        details: { stream },
        created: {
          date: new Date(stream.createdAt),
          fallback: <i>unseen</i>,
        },
        lastActive: {
          date: new Date(stream.lastSeen),
          fallback: <i>unseen</i>,
        },
        status: stream.isActive ? "Active" : "Idle",
      };
    });
  });

  const handleRowSelectionChange = useCallback(
    (rows: Row<StreamsTableData>[]) => {
      setSelectedStreams(
        rows.map((r) => (data ?? []).find((s) => s.id === r.original.id))
      );
    },
    [data]
  );

  return (
    <Box>
      <Flex
        align="end"
        justify="between"
        css={{
          mb: "$5",
        }}>
        <Heading size="2">
          <Flex>
            <Box
              css={{
                mr: "$3",
                fontWeight: 600,
                letterSpacing: 0,
              }}>
              {title}
            </Box>
            <Badge
              size="1"
              variant="violet"
              css={{ letterSpacing: 0, mt: "7px" }}>
              1 active right now
            </Badge>
          </Flex>
        </Heading>

        <Flex css={{ alignItems: "center" }}>
          {/* <Box>
              <Button
                aria-label="Delete Stream button"
                disabled={!selectedStreams.length}
                onClick={() => selectedStreams.length && setDeleteModal(true)}>
                Delete
              </Button>
              <Box
                css={{
                  ml: "1.4em",
                  display: "inline-block",
                }}>
                <b>New beta feature</b>: Record your live streams. Send feedback
                to help@livepeer.com.
                <a
                  target="_blank"
                  href="https://livepeer.com/blog/record-every-video-livestream-with-livepeer"
                  css={{
                    display: "inline-block",
                    ml: "0.2em",
                    textDecoration: "none",
                    color: "primary",
                    cursor: "pointer",
                    ":hover": { textDecoration: "underline" },
                  }}>
                  <b>Read more ⬈</b>
                </a>
              </Box>
            </Box> */}

          <TableFilter items={filterItems} onDone={onDone} />
          <CreateStream />
        </Flex>
      </Flex>
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
      <Box css={{ mb: "$5" }}>
        <Table
          columns={columns}
          data={data ?? []}
          rowSelection="all"
          onRowSelectionChange={handleRowSelectionChange}
          initialSortBy={[{ id: "created", desc: true }]}
        />
      </Box>
      <Flex
        justify="end"
        align="center"
        css={{ fontSize: "$3", color: "$hiContrast" }}>
        <Link href="/dashboard/streams" passHref>
          <A variant="violet" css={{ display: "flex", alignItems: "center" }}>
            View all <ArrowRightIcon />
          </A>
        </Link>
      </Flex>
    </Box>
  );
};

export default StreamsTable;
