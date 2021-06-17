import { useEffect, useMemo, useState } from "react";
import { useApi, usePageVisibility } from "../../../hooks";
import Table, { Fetcher, useTableState } from "components/Dashboard/Table";
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
import { Column } from "react-table";
import {
  CellComponentProps,
  TableData,
} from "components/Dashboard/Table/types";
import { isStaging, isDevelopment } from "../../../lib/utils";
import { Box, Flex, Heading, Link as A } from "@livepeer.com/design-system";
import { useCallback } from "react";

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

const pageSize = 50;

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

const AllSessionsTable = ({ title = "Sessions" }: { title?: string }) => {
  const { user, getStreamSessionsByUserId } = useApi();
  const tableProps = useTableState();

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

  const fetcher: Fetcher<SessionsTableData> = useCallback(
    async (state) => {
      const [streams, nextCursor] = await getStreamSessionsByUserId(
        user.id,
        state.cursor,
        pageSize
      );
      return {
        nextCursor,
        rows: streams.map((stream: any) => {
          return {
            id: stream.id,
            parentStream: {
              id: stream.parentId,
              children: stream.parentStream.name,
              tooltipChildren: stream.createdByTokenName ? (
                <>
                  Created by stream <b>{stream.parentStream.name}</b>
                </>
              ) : null,
              href: `/dashboard/streams/${stream.id}`,
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
            created: {
              date: new Date(stream.createdAt),
              fallback: <i>unseen</i>,
            },
          };
        }),
      };
    },
    [getStreamSessionsByUserId, user.id]
  );

  return (
    <Table
      {...tableProps}
      tableId="sessions"
      columns={columns}
      fetcher={fetcher}
      pageSize={pageSize}
      rowSelection={null}
      initialSortBy={[{ id: "created", desc: true }]}
      showOverflow={true}
      cursor="pointer"
      header={
        <>
          <Heading size="2" css={{ fontWeight: 600 }}>
            {title}
          </Heading>
        </>
      }
    />
  );
};

export default AllSessionsTable;
