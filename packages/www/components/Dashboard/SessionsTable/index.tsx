import { useCallback, useMemo } from "react";
import { useApi } from "../../../hooks";
import Table, { Fetcher, useTableState } from "components/Dashboard/Table";
import { TextCellProps } from "components/Dashboard/Table/cells/text";
import DateCell, { DateCellProps } from "components/Dashboard/Table/cells/date";
import DurationCell, {
  DurationCellProps,
} from "components/Dashboard/Table/cells/duration";
import { dateSort, numberSort } from "components/Dashboard/Table/sorts";
import Link from "next/link";
import { SortTypeArgs } from "components/Dashboard/Table/types";
import { Column } from "react-table";
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
  Link as A,
} from "@livepeer.com/design-system";
import { FilterItem, formatFiltersForApiRequest } from "../Table/filters";

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
    pageSize: 50,
    tableId: "Streams Sessions Table",
  });

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
        Sessions belong to a single parent stream.
      </Text>
      <Link href="/docs/api-reference/session/session" passHref>
        <A variant="violet" css={{ mb: "$5", display: "block" }}>
          Learn more
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
        cursor="pointer"
        emptyState={emptyState}
      />
    </Box>
  );
};

export default StreamSessionsTable;
