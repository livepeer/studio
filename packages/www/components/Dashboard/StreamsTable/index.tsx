import {
  Heading,
  Box,
  Flex,
  Button,
  Link as A,
  Badge,
  styled,
  Text,
} from "@livepeer.com/design-system";
import ReactTooltip from "react-tooltip";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi, usePageVisibility } from "../../../hooks";
import Table from "components/Dashboard/Table";
import { Stream } from "@livepeer.com/api";
import TextCell, { TextCellProps } from "components/Dashboard/Table/cells/text";
import { Column, Row } from "react-table";
import DateCell, { DateCellProps } from "components/Dashboard/Table/cells/date";
import {
  RenditionDetailsCellProps,
  RenditionsDetailsCell,
} from "components/Dashboard/Table/cells/streams-table";
import { dateSort, stringSort } from "components/Dashboard/Table/sorts";
import { SortTypeArgs } from "components/Dashboard/Table/types";
import CreateStream from "components/Dashboard/CreateStream";
import Delete from "./Delete";
import {
  QuestionMarkIcon,
  PlusIcon,
  ArrowRightIcon,
} from "@radix-ui/react-icons";

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
                color: "$mauve7",
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

const pageSize = 3;

const StreamsTable = ({
  title = "Streams",
  userId,
}: {
  title: string;
  userId: string;
}) => {
  const [selectedStreams, setSelectedStreams] = useState([]);
  const [streams, setStreams] = useState([]);
  const [pageNumber, setPageNumber] = useState(0);
  const [loadingState, setLoadingState] = useState(false);
  const { getStreams, deleteStream, deleteStreams, getBroadcasters } = useApi();
  const [onUnselect, setOnUnselect] = useState();

  useEffect(() => {
    getStreams(userId)
      .then((streams) => setStreams(streams))
      .catch((err) => console.error(err)); // todo: surface this
  }, [userId]);

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

  const data: StreamsTableData[] = useMemo(() => {
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

  const slicedData = useMemo(() => {
    return data
      .slice(pageNumber * pageSize, (pageNumber + 1) * pageSize)
      .map((data) => data);
  }, [data]);

  const handleNextPage = useCallback(() => {
    setPageNumber((prev) => prev + 1);
  }, []);

  const handlePreviousPage = useCallback(() => {
    setPageNumber((prev) => prev - 1);
  }, []);

  useEffect(() => {
    setLoadingState(true);
    setTimeout(() => {
      setLoadingState(false);
    }, 2000);
  }, [pageNumber]);

  return (
    <Box
      css={{
        height: "calc(100vh - 130px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}>
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
          {!!selectedStreams.length && (
            <Delete
              onUnselect={onUnselect}
              total={selectedStreams.length}
              onDelete={async () => {
                if (selectedStreams.length === 1) {
                  await deleteStream(selectedStreams[0].id);
                } else if (selectedStreams.length > 1) {
                  await deleteStreams(selectedStreams.map((s) => s.id));
                }
              }}
            />
          )}
          {!selectedStreams.length && <CreateStream />}
        </Flex>
      </Flex>

      <Box css={{ mb: "$5" }}>
        <Table
          setOnUnselect={setOnUnselect}
          columns={columns}
          data={slicedData}
          rowSelection="all"
          onRowSelectionChange={handleRowSelectionChange}
          initialSortBy={[{ id: "created", desc: true }]}
          cursor="pointer"
        />
      </Box>
      <Flex justify="between" align="center">
        <Text>
          <b>{data.length}</b> results
        </Text>
        <Flex>
          <Button
            css={{ marginRight: "6px" }}
            onClick={() => {
              try {
                setLoadingState(true);
                handlePreviousPage();
                setLoadingState(false);
              } catch (error) {
                setLoadingState(false);
              }
            }}
            disabled={pageNumber <= 0}>
            Previous
          </Button>
          <Button
            onClick={() => {
              try {
                setLoadingState(true);
                handleNextPage();
                setLoadingState(false);
              } catch (error) {
                setLoadingState(false);
              }
            }}
            disabled={(pageNumber + 1) * pageSize >= data.length}>
            Next
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default StreamsTable;
