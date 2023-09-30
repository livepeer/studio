import DateCell, { DateCellProps } from "components/Table/cells/date";
import DurationCell, {
  DurationCellProps,
} from "components/Table/cells/duration";
import TextCell, { TextCellProps } from "components/Table/cells/text";
import ClipsCell, { ClipsCellProps } from "./ClipsCell";
import { dateSort, numberSort } from "components/Table/sorts";
import {
  FilterItem,
  formatFiltersForApiRequest,
} from "components/Table/filters";
import {
  HoverCardRoot,
  HoverCardTrigger,
  Flex,
  Box,
  HoverCardContent,
  Text,
} from "@livepeer/design-system";
import { CopyIcon } from "@radix-ui/react-icons";
import { truncate } from "../../../lib/utils";
import RecordingUrlCell from "./RecordingUrlCell";
import { RowsPageFromStateResult, SortTypeArgs } from "components/Table/types";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { State } from "../../Table";

export const filterItems: FilterItem[] = [
  { label: "Created Date", id: "createdAt", type: "date" },
  {
    label: "Duration (in minutes)",
    id: "sourceSegmentsDuration",
    type: "number",
  },
];

export type SessionsTableData = {
  id: string;
  recordingUrl: TextCellProps;
  createdAt: DateCellProps;
  sourceSegmentsDuration: DurationCellProps;
};

export const makeColumns = () => [
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
        ...params
      ),
  },
  {
    Header: "Clips",
    accessor: "clips",
    Cell: ClipsCell,
    disableSortBy: true,
    width: 50,
  },
  {
    Header: "Recording URL",
    accessor: "recordingUrl",
    Cell: RecordingUrlCell,
    disableSortBy: true,
  },
];

export const rowsPageFromState = async (
  state: State<SessionsTableData>,
  streamId: string,
  getStreamSessions: Function,
  getClipsBySessionId: Function,
  openSnackbar: Function
): Promise<RowsPageFromStateResult<SessionsTableData>> => {
  const [streams, nextCursor, count] = await getStreamSessions(
    streamId,
    state.cursor,
    state.pageSize,
    formatFiltersForApiRequest(state.filters, {
      parseNumber: (n) => n * 60,
    }),
    true
  );

  const clipsPromises = streams.map((stream: any) =>
    getClipsBySessionId(stream.id, null, 100, null, null, 1)
  );

  const clipsCounts = await Promise.all(clipsPromises);

  streams.forEach((stream: any, index: number) => {
    stream.clipsCounts = clipsCounts[index][2];
  });

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
        },
        clips: {
          id: stream.id,
          children: <Box></Box>,
          sessionId: stream.id,
          clipsCounts: stream.clipsCounts,
        },
        sourceSegmentsDuration: {
          sourceSegmentsDuration: stream.sourceSegmentsDuration || 0,
          status: stream.recordingStatus,
        },
        createdAt: {
          date: new Date(stream.createdAt),
          fallback: <Box>—</Box>,
        },
      };
    }),
  };
};
