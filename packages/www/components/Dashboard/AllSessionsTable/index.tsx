import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi, usePageVisibility } from "../../../hooks";
import Table from "components/Dashboard/Table";
import TextCell, { TextCellProps } from "components/Dashboard/Table/cells/text";
import DateCell, { DateCellProps } from "components/Dashboard/Table/cells/date";
import DurationCell, {
  DurationCellProps,
} from "components/Dashboard/Table/cells/duration";
import {
  dateSort,
  numberSort,
  stringSort,
} from "components/Dashboard/Table/sorts";
import Link from "next/link";
import { SortTypeArgs } from "components/Dashboard/Table/types";
import { Column, Row } from "react-table";
import {
  CellComponentProps,
  TableData,
} from "components/Dashboard/Table/types";
import { isStaging, isDevelopment } from "../../../lib/utils";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Link as A,
} from "@livepeer.com/design-system";
import Delete from "components/Dashboard/DeleteSessions";

function makeMP4Url(hlsUrl: string, profileName: string): string {
  const pp = hlsUrl.split("/");
  pp.pop();
  return pp.join("/") + "/" + profileName + ".mp4";
}

type Profile = { name: string; width: number; height: number };
export type RecordingUrlCellProps = {
  children?: React.ReactNode;
  tooltipChildren?: React.ReactNode;
  href?: string;
  id?: string;
  profiles?: Array<Profile>;
  showMP4: boolean;
};

const RecordingUrlCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, RecordingUrlCellProps>) => {
  const id = cell.value.id;

  return (
    <Box id={`mp4-link-dropdown-${id}`} css={{ position: "relative" }}>
      {cell.value.href ? (
        <Flex css={{ justifyContent: "space-between" }}>
          <Link href={cell.value.href} passHref>
            <A variant="violet">{cell.value.children}</A>
          </Link>
          {cell.value.showMP4 && cell.value.profiles?.length ? (
            <Box>
              <A
                variant="violet"
                target="_blank"
                href={makeMP4Url(cell.value.href, "source")}>
                Download mp4
              </A>
            </Box>
          ) : null}
        </Flex>
      ) : (
        cell.value.children
      )}
    </Box>
  );
};

type SessionsTableData = {
  id: string;
  parentStream: TextCellProps;
  recordingUrl: TextCellProps;
  created: DateCellProps;
  duration: DurationCellProps;
};

const pageSize = 14;

const AllSessionsTable = ({ title = "Sessions" }: { title?: string }) => {
  const [sessions, setSessions] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const { user, getStreamSessionsByUserId } = useApi();
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(0);
  const { deleteStream, deleteStreams } = useApi();
  const [onUnselect, setOnUnselect] = useState();

  useEffect(() => {
    getStreamSessionsByUserId(user.id, undefined, 0)
      .then(([streams, nextCursor]) => {
        setSessions(streams);
      })
      .catch((err) => console.error(err)); // todo: surface this
  }, [user.id]);

  const isVisible = usePageVisibility();

  useEffect(() => {
    if (!isVisible) {
      return;
    }
    const interval = setInterval(() => {
      if (!sessionsLoading) {
        setSessionsLoading(true);
        getStreamSessionsByUserId(user.id, undefined, 0)
          .then(([streams, nextCursor]) => {
            setSessions(streams);
          })
          .catch((err) => console.error(err)) // todo: surface this
          .finally(() => setSessionsLoading(false));
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const columns: Column<SessionsTableData>[] = useMemo(
    () => [
      {
        Header: "Stream",
        accessor: "parentStream",
        Cell: TextCell,
        sortType: (...params: SortTypeArgs) =>
          stringSort("original.parentStream.name", ...params),
      },
      {
        Header: "Created at",
        accessor: "created",
        Cell: DateCell,
        sortType: (...params: SortTypeArgs) =>
          dateSort("original.created.date", ...params),
      },
      {
        Header: "Session duration",
        accessor: "duration",
        Cell: DurationCell,
        sortType: (...params: SortTypeArgs) =>
          numberSort("original.duration.duration", ...params),
      },
      {
        Header: "Recording URL",
        accessor: "recordingUrl",
        Cell: RecordingUrlCell,
        disableSortBy: true,
      },
    ],
    []
  );

  const data: SessionsTableData[] = useMemo(() => {
    return sessions.map((stream) => {
      return {
        id: stream.id,
        parentStream: {
          id: stream.parentId,
          children: stream?.parentStream?.name,
          tooltipChildren: stream.createdByTokenName ? (
            <>
              Created by stream <b>{stream?.parentStream?.name}</b>
            </>
          ) : null,
          href: `/dashboard/streams/${stream.parentId}`,
        },
        recordingUrl: {
          id: stream.id,
          showMP4: user?.admin || isStaging() || isDevelopment(),
          profiles:
            stream.recordingUrl &&
            stream.recordingStatus === "ready" &&
            stream.profiles?.length
              ? [{ name: "source" }, ...stream.profiles]
              : undefined,
          children:
            stream.recordingUrl && stream.recordingStatus === "ready" ? (
              stream.recordingUrl
            ) : (
              <Box css={{ color: "$mauve8" }}>—</Box>
            ),
          href: stream.recordingUrl ? stream.recordingUrl : undefined,
        },
        duration: {
          duration: stream.sourceSegmentsDuration || 0,
          status: stream.recordingStatus,
        },
        created: { date: new Date(stream.createdAt), fallback: <i>unseen</i> },
      };
    });
  }, [sessions]);

  const handleRowSelectionChange = useCallback(
    (rows: Row<SessionsTableData>[]) => {
      setSelectedSessions(
        rows.map((r) => sessions.find((s) => s.id === r.original.id))
      );
    },
    [sessions]
  );

  const slicedData = useMemo(() => {
    if (!data) return;
    return data
      .slice(pageNumber * pageSize, (pageNumber + 1) * pageSize)
      .map((data) => data);
  }, [pageNumber, data]);

  const handleNextPage = useCallback(() => {
    setPageNumber((prev) => prev + 1);
  }, []);

  const handlePreviousPage = useCallback(() => {
    setPageNumber((prev) => prev - 1);
  }, []);

  return sessions.length ? (
    <Flex
      css={{
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
          </Flex>
        </Heading>
        <Flex css={{ ai: "center" }}>
          {!!selectedSessions.length && (
            <Delete
              onUnselect={onUnselect}
              total={selectedSessions.length}
              onDelete={async () => {
                if (selectedSessions.length === 1) {
                  await deleteStream(selectedSessions[0].id);
                } else if (selectedSessions.length > 1) {
                  await deleteStreams(selectedSessions.map((s) => s.id));
                }
                const streamSessions = await getStreamSessionsByUserId(
                  user.id,
                  undefined,
                  0
                );
                setSessions(streamSessions);
              }}
            />
          )}
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
            onClick={handlePreviousPage}
            disabled={pageNumber <= 0}>
            Previous
          </Button>
          <Button
            onClick={handleNextPage}
            disabled={(pageNumber + 1) * pageSize >= data.length}>
            Next
          </Button>
        </Flex>
      </Flex>
    </Flex>
  ) : null;
};

export default AllSessionsTable;
