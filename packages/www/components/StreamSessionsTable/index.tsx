/** @jsx jsx */
import { jsx } from "theme-ui";
import { useEffect, useMemo, useState } from "react";
import { useApi, usePageVisibility } from "../../hooks";
import { Box, Button, Flex, Link as A } from "@theme-ui/components";
import TableV2 from "../Table-v2";
// import { usePopper } from "react-popper";
import TextCell, { TextCellProps } from "components/Table-v2/cells/text";
import DateCell, { DateCellProps } from "components/Table-v2/cells/date";
import DurationCell, {
  DurationCellProps,
} from "components/Table-v2/cells/duration";
import { dateSort, numberSort } from "components/Table-v2/sorts";
import Link from "next/link";
import { SortTypeArgs } from "components/Table-v2/types";
import { Column } from "react-table";
import { CellComponentProps, TableData } from "components/Table-v2/types";
import { isStaging, isDevelopment } from "../../lib/utils";

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

function getHighestMP4Url(hlsUrl: string, profiles: Array<Profile>): string {
  const [profileName, _] = profiles.reduce<[string, number]>(
    (pv, cv) => {
      if (cv.width * cv.height > pv[1]) {
        return [cv.name, cv.width * cv.height];
      }
      return pv;
    },
    ["", 0]
  );
  return makeMP4Url(hlsUrl, profileName);
}

const RecordingUrlCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, RecordingUrlCellProps>) => {
  const id = cell.value.id;

  return (
    <div id={`mp4-link-dropdown-${id}`} sx={{ position: "relative" }}>
      {cell.value.href ? (
        <Flex sx={{ justifyContent: "space-between" }}>
          <Link href={cell.value.href}>
            <a>{cell.value.children}</a>
          </Link>
          {cell.value.showMP4 && cell.value.profiles?.length ? (
            <Box>
              <A
                variant="downloadOutline"
                // target="_blank"
                href={makeMP4Url(cell.value.href, "source")}
                sx={{ p: 1 }}>
                Download&nbsp;mp4&nbsp;beta
              </A>
            </Box>
          ) : null}
        </Flex>
      ) : (
        cell.value.children
      )}
    </div>
  );
};

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
          .finally(() => setSessionsLoading(false));
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
        Cell: RecordingUrlCell,
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
          id: stream.id,
          showMP4: user?.admin || isStaging() || isDevelopment(),
          profiles:
            stream.recordingUrl &&
            stream.recordingStatus === "ready" &&
            stream.profiles?.length
              ? [{ name: "source" }, ...stream.profiles]
              : undefined,
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
        showOverflow={true}
      />
    </Box>
  ) : null;
};

export default StreamSessionsTable;
