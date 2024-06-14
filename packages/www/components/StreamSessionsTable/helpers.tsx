import {
  Box,
  HoverCardRoot,
  HoverCardTrigger,
  Flex,
  HoverCardContent,
  Link,
  Text,
} from "@livepeer/design-system";
import { CopyIcon } from "@radix-ui/react-icons";
import RecordingUrlCell from "../StreamDetails/SessionsTable/RecordingUrlCell";
import DateCell, { DateCellProps } from "../Table/cells/date";
import DurationCell, { DurationCellProps } from "../Table/cells/duration";
import TextCell, { TextCellProps } from "../Table/cells/text";
import { FilterItem, formatFiltersForApiRequest } from "../Table/filters";
import { stringSort, dateSort, numberSort } from "../Table/sorts";
import { RowsPageFromStateResult, SortTypeArgs } from "../Table/types";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { truncate } from "../../lib/utils";
import { State } from "../Table";
import TableEmptyState from "../Table/components/TableEmptyState";

export const filterItems: FilterItem[] = [
  { label: "Created Date", id: "createdAt", type: "date" },
  {
    label: "Duration (in minutes)",
    id: "sourceSegmentsDuration",
    type: "number",
  },
];

export type StreamSessionsTableData = {
  id: string;
  parentStream: TextCellProps;
  recordingUrl: TextCellProps;
  createdAt: DateCellProps;
  sourceSegmentsDuration: DurationCellProps;
};

export const makeColumns = () => [
  {
    Header: "Stream",
    accessor: "parentStream",
    Cell: TextCell,
    sortType: (...params: SortTypeArgs) =>
      stringSort("original.parentStream.name", ...params),
  },
  {
    Header: "Created at",
    accessor: "createdAt",
    Cell: DateCell,
    sortType: (...params: SortTypeArgs) =>
      dateSort("original.createdAt.date", ...params),
  },
  {
    Header: "Duration",
    accessor: "sourceSegmentsDuration",
    Cell: DurationCell,
    sortType: (...params: SortTypeArgs) =>
      numberSort(
        "original.sourceSegmentsDuration.sourceSegmentsDuration",
        ...params,
      ),
  },
  {
    Header: "Recording URL",
    accessor: "recordingUrl",
    Cell: RecordingUrlCell,
    disableSortBy: true,
  },
];

export const rowsPageFromState = async (
  state: State<StreamSessionsTableData>,
  userId: string,
  getStreamSessionsByUserId: Function,
  openSnackbar: Function,
): Promise<RowsPageFromStateResult<StreamSessionsTableData>> => {
  const [streams, nextCursor, count] = await getStreamSessionsByUserId(
    userId,
    state.cursor,
    state.pageSize,
    state.order,
    formatFiltersForApiRequest(state.filters, {
      parseNumber: (n) => n * 60,
    }),
    true,
  );

  return {
    nextCursor,
    count,
    rows: streams.map((stream: any) => {
      return {
        id: stream.id,
        parentStream: {
          id: stream.parentId,
          name: stream.parentStream.name,
          children: <Box>{stream.parentStream.name}</Box>,
          href: `/streams/${stream.parentId}`,
        },
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
                  <Flex css={{ ai: "center" }}>
                    <CopyToClipboard
                      text={stream.recordingUrl}
                      onCopy={() => openSnackbar("Copied to clipboard")}>
                      <Flex
                        css={{
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
                    variant="neutral"
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
              <Box>—</Box>
            ),
          mp4Url: stream.mp4Url ?? stream.mp4Url,
          sessionId: stream.id,
        },
        sourceSegmentsDuration: {
          sourceSegmentsDuration: stream.sourceSegmentsDuration || 0,
          status: stream.recordingStatus,
        },
        createdAt: {
          date: new Date(stream.createdAt),
          fallback: <i>unseen</i>,
        },
      };
    }),
  };
};

export const makeEmptyState = () => (
  <TableEmptyState
    title="No stream sessions"
    description="New stream sessions are created whenever streams become active."
    learnMoreUrl="https://docs.livepeer.studio/reference/api/get-session"
  />
);
