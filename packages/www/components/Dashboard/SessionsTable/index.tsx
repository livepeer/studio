import { useCallback, useMemo } from "react";
import { useApi } from "../../../hooks";
import Table, { Fetcher, useTableState } from "components/Dashboard/Table";
import DateCell, { DateCellProps } from "components/Dashboard/Table/cells/date";
import DurationCell, {
  DurationCellProps,
} from "components/Dashboard/Table/cells/duration";
import { TextCellProps } from "components/Dashboard/Table/cells/text";
import { dateSort, numberSort } from "components/Dashboard/Table/sorts";
import Link from "next/link";
import { SortTypeArgs } from "components/Dashboard/Table/types";
import { Column } from "react-table";
import {
  CellComponentProps,
  TableData,
} from "components/Dashboard/Table/types";
import { truncate } from "../../../lib/utils";
import {
  Box,
  Flex,
  Heading,
  Text,
  Link as A,
  HoverCardRoot,
  HoverCardContent,
  HoverCardTrigger,
  useSnackbar,
} from "@livepeer.com/design-system";
import { FilterItem, formatFiltersForApiRequest } from "../Table/filters";
import { ArrowRightIcon, CopyIcon } from "@radix-ui/react-icons";
import { CopyToClipboard } from "react-copy-to-clipboard";

function makeMP4Url(hlsUrl: string, profileName: string): string {
  const pp = hlsUrl.split("/");
  pp.pop();
  return pp.join("/") + "/" + profileName + ".mp4";
}

type Profile = { name: string; width: number; height: number };
export type RecordingUrlCellProps = {
  children?: React.ReactNode;
  tooltipChildren?: React.ReactNode;
  mp4Url?: string;
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
      {cell.value.mp4Url ? (
        <Flex css={{ justifyContent: "space-between", ai: "center" }}>
          {truncate(cell.value.children, 20)}
          {cell.value.showMP4 && cell.value.profiles?.length ? (
            <Box>
              <A
                css={{}}
                variant="violet"
                target="_blank"
                href={makeMP4Url(cell.value.mp4Url, "source")}>
                Download mp4
              </A>
            </Box>
          ) : null}
        </Flex>
      ) : (
        truncate(cell.value.children, 20)
      )}
    </Box>
  );
};

const filterItems: FilterItem[] = [
  { label: "Session Name", id: "name", type: "text" },
  { label: "Created Date", id: "createdAt", type: "date" },
  {
    label: "Duration (in minutes)",
    id: "sourceSegmentsDuration",
    type: "number",
  },
];

type SessionsTableData = {
  id: string;
  recordingUrl: TextCellProps;
  created: DateCellProps;
  duration: DurationCellProps;
};

const StreamSessionsTable = ({
  title = "Sessions",
  streamId,
}: {
  title?: string;
  streamId: string;
  mt?: string | number;
}) => {
  const { user, getStreamSessions } = useApi();
  const tableProps = useTableState({
    tableId: "streamSessionsTable",
  });
  const [openSnackbar] = useSnackbar();

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

  const fetcher: Fetcher<SessionsTableData> = useCallback(
    async (state) => {
      const [streams, nextCursor, count] = await getStreamSessions(
        streamId,
        state.cursor,
        state.pageSize,
        formatFiltersForApiRequest(state.filters, {
          parseNumber: (n) => n * 60,
        }),
        true
      );
      return {
        nextCursor,
        count,
        rows: streams.map((stream: any) => {
          return {
            id: stream.id,
            recordingUrl: {
              id: stream.id,
              showMP4: true,
              profiles:
                stream.recordingUrl &&
                stream.recordingStatus === "ready" &&
                stream.profiles?.length
                  ? [{ name: "source" }, ...stream.profiles]
                  : undefined,
              children:
                stream.recordingUrl && stream.recordingStatus === "ready" ? (
                  <HoverCardRoot openDelay={200}>
                    <HoverCardTrigger>
                      <Flex css={{ height: 25, ai: "center" }}>
                        <CopyToClipboard
                          text={stream.recordingUrl}
                          onCopy={() => openSnackbar("Copied to clipboard")}>
                          <Flex
                            css={{
                              cursor: "pointer",
                              fontSize: "$1",
                              ai: "center",
                            }}>
                            <Box css={{ mr: "$1" }}>
                              {truncate(stream.recordingUrl, 24)}
                            </Box>
                            <CopyIcon />
                          </Flex>
                        </CopyToClipboard>
                      </Flex>
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <Text
                        variant="gray"
                        css={{
                          backgroundColor: "$panel",
                          borderRadius: 6,
                          px: "$3",
                          py: "$1",
                          fontSize: "$1",
                          display: "flex",
                          ai: "center",
                        }}>
                        <Box css={{ ml: "$2" }}>{stream.recordingUrl}</Box>
                      </Text>
                    </HoverCardContent>
                  </HoverCardRoot>
                ) : (
                  <Box css={{ color: "$mauve8" }}>—</Box>
                ),
              mp4Url: stream.recordingUrl ? stream.recordingUrl : undefined,
            },
            duration: {
              duration: stream.sourceSegmentsDuration || 0,
              status: stream.recordingStatus,
            },
            created: {
              date: new Date(stream.createdAt),
              fallback: <Box css={{ color: "$mauve8" }}>—</Box>,
            },
          };
        }),
      };
    },
    [getStreamSessions, user.id]
  );

  const emptyState = (
    <Flex
      direction="column"
      justify="center"
      css={{
        margin: "0 auto",
        height: "calc(100vh - 400px)",
        maxWidth: 450,
      }}>
      <Heading css={{ fontWeight: 500, mb: "$3" }}>No sessions</Heading>
      <Text variant="gray" css={{ lineHeight: 1.5, mb: "$3" }}>
        Sessions belong to parent streams.
      </Text>
      <Link href="/docs/api-reference/session/overview" passHref>
        <A variant="violet" css={{ display: "flex", ai: "center", mb: "$5" }}>
          <Box>Learn more</Box>
          <ArrowRightIcon />
        </A>
      </Link>
    </Flex>
  );

  return (
    <Box>
      <Table
        {...tableProps}
        header={
          <>
            <Heading>{title}</Heading>
          </>
        }
        filterItems={filterItems}
        columns={columns}
        fetcher={fetcher}
        rowSelection={null}
        initialSortBy={[{ id: "created", desc: true }]}
        showOverflow={true}
        emptyState={emptyState}
      />
    </Box>
  );
};

export default StreamSessionsTable;
