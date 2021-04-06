import { useCallback, useEffect, useMemo, useState } from "react";
import { useApi, usePageVisibility } from "../../hooks";
import { Box, Container, Flex } from "@theme-ui/components";
import TableV2 from "../Table-v2";
import TextCell, { TextCellProps } from "components/Table-v2/cells/text";
import DateCell, { DateCellProps } from "components/Table-v2/cells/date";
import DurationCell, {
  DurationCellProps,
} from "components/Table-v2/cells/duration";
import { dateSort, numberSort } from "components/Table-v2/sorts";
import { SortTypeArgs } from "components/Table-v2/types";
import { Column } from "react-table";

type SessionsTableData = {
  id: string;
  recordingUrl: TextCellProps;
  created: DateCellProps;
  duration: DurationCellProps;
};

const StreamSessionsTable = ({
  streamId,
  mt = null,
}: {
  streamId: string;
  mt?: string | number;
}) => {
  const [streamsSessions, setStreamsSessions] = useState([]);
  const { user, getStreamSessions } = useApi();
  const [sessionsLoading, setSessionsLoading] = useState(false);
  useEffect(() => {
    getStreamSessions(streamId, undefined, 0)
      .then(([streams, nextCursor]) => {
        setStreamsSessions(streams);
      })
      .catch((err) => console.error(err)); // todo: surface this
  }, [streamId]);
  const isVisible = usePageVisibility();
  useEffect(() => {
    if (!isVisible) {
      return;
    }
    const interval = setInterval(() => {
      if (!sessionsLoading) {
        setSessionsLoading(true);
        getStreamSessions(streamId, undefined, 0)
          .then(([streams, nextCursor]) => {
            setStreamsSessions(streams);
          })
          .catch((err) => console.error(err)) // todo: surface this
          .finally(()=> setSessionsLoading(false));
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [streamId, isVisible]);

  const columns: Column<SessionsTableData>[] = useMemo(
    () => [
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
        Cell: TextCell,
        disableSortBy: true,
      },
    ],
    []
  );

  const data: SessionsTableData[] = useMemo(() => {
    return streamsSessions.map((stream) => {
      return {
        id: stream.id,
        recordingUrl: {
          children:
            stream.recordingUrl && stream.recordingStatus === "ready"
              ? stream.recordingUrl
              : "n/a",
          href: stream.recordingUrl ? stream.recordingUrl : undefined,
        },
        duration: {
          duration: stream.sourceSegmentsDuration || 0,
          status: stream.recordingStatus,
        },
        created: { date: new Date(stream.createdAt), fallback: <i>unseen</i> },
      };
    });
  }, [streamsSessions]);

  return streamsSessions.length ? (
    <Box sx={{ mb: "0.5em", mt: "2em" }}>
      <h4 sx={{ mb: "0.5em" }}>Stream Sessions</h4>
      <TableV2
        columns={columns}
        data={data}
        pageSize={50}
        rowSelection={null}
        initialSortBy={[{ id: "created", desc: true }]}
      />
    </Box>
  ) : null;
};

export default StreamSessionsTable;
