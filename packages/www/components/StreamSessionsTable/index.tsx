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

export type RecordingUrlCellProps = {
  children?: React.ReactNode;
  tooltipChildren?: React.ReactNode;
  href?: string;
  id?: string;
  profiles?: Array<{ name: string }>;
  showMP4: boolean;
};

const RecordingUrlCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, RecordingUrlCellProps>) => {
  const id = cell.value.id;

  const [isOpen, setIsOpen] = useState(false);

  function handleClick(e: any) {
    const isInside = e?.target?.closest(`#mp4-dropdown-${id}`) !== null;
    if (isInside) return;
    setIsOpen(false);
    document.removeEventListener("click", handleClick);
  }

  useEffect(() => {
    if (isOpen) document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isOpen]);

  return (
    <div id={`mp4-link-dropdown-${id}`} sx={{ position: "relative" }}>
      {cell.value.href ? (
        <Flex sx={{ justifyContent: "space-between" }}>
          <Link href={cell.value.href}>
            <a>{cell.value.children}</a>
          </Link>
          {isOpen ? (
            <div
              id={`mp4-dropdown-${id}`}
              sx={{
                position: "absolute",
                right: "-15px",
                top: "32px",
                width: "max-content",
                bg: "background",
                boxShadow:
                  "0px 24px 40px rgba(0, 0, 0, 0.24), 0px 30px 30px rgba(0, 0, 0, 0.02)",
                borderRadius: 8,
                p: 3,
                border: "1px solid #EAEAEA",
              }}>
              <div
                sx={{
                  position: "absolute",
                  right: "15px",
                  top: "-8px",
                }}>
                <svg
                  width="20"
                  height="10"
                  viewBox="0 0 20 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M17.2839 7.5H18.5C19.0523 7.5 19.5 7.94772 19.5 8.5C19.5 9.05229 19.0523 9.5 18.5 9.5H1.5C0.947715 9.5 0.5 9.05229 0.5 8.5C0.5 7.94772 0.947715 7.5 1.5 7.5H2.76293C3.69243 7.5 4.57781 7.10358 5.19688 6.41023L9.06779 2.07481C9.68073 1.38832 10.7616 1.41058 11.3458 2.12172L14.7987 6.32528C15.4096 7.06898 16.3215 7.5 17.2839 7.5Z"
                    fill="white"
                    stroke="#EAEAEA"
                  />
                  <rect y="8" width="20" height="2" fill="white" />
                </svg>
              </div>
              {cell.value.profiles.map((pr) => (
                <div>
                  <A
                    variant="download"
                    target="_blank"
                    href={makeMP4Url(cell.value.href, pr.name)}
                    sx={{ p: 1 }}>
                    {pr.name}.mp4
                  </A>
                </div>
              ))}
            </div>
          ) : null}
          {cell.value.showMP4 && cell.value.profiles?.length ? (
            <Box>
              <Button
                variant="outline"
                sx={{ p: 1 }}
                onClick={(e) => {
                  e.preventDefault();
                  setIsOpen(!isOpen);
                }}>
                Download
              </Button>
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
