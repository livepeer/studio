import { Box, Link } from "@livepeer/design-system";
import { State } from "../Table";
import DateCell, { DateCellProps } from "../Table/cells/date";
import { RenditionDetailsCellProps } from "../Table/cells/streams-table";
import TextCell, { TextCellProps } from "../Table/cells/text";
import { FilterItem, formatFiltersForApiRequest } from "../Table/filters";
import { stringSort, dateSort } from "../Table/sorts";
import { SortTypeArgs } from "../Table/types";

export type StreamsTableData = {
  id: string;
  name: TextCellProps;
  details: RenditionDetailsCellProps;
  createdAt: DateCellProps;
  lastSeen: DateCellProps;
  status: TextCellProps;
};

export type RowsPageFromStateResult = {
  rows: StreamsTableData[];
  nextCursor: any;
  count: any;
};

export const filterItems: FilterItem[] = [
  { label: "Name", id: "name", type: "text" },
  { label: "Created", id: "createdAt", type: "date" },
  { label: "Last seen", id: "lastSeen", type: "date" },
  {
    label: "Status",
    id: "isActive",
    type: "boolean",
    labelOn: "Active",
    labelOff: "Idle",
  },
];

export const makeColumns = () => [
  {
    Header: "Name",
    accessor: "name",
    Cell: TextCell,
    sortType: (...params: SortTypeArgs) =>
      stringSort("original.name.value", ...params),
  },
  {
    Header: "Created",
    accessor: "createdAt",
    Cell: DateCell,
    sortType: (...params: SortTypeArgs) =>
      dateSort("original.createdAt.date", ...params),
  },
  {
    Header: "Last seen",
    accessor: "lastSeen",
    Cell: DateCell,
    sortType: (...params: SortTypeArgs) =>
      dateSort("original.lastSeen.date", ...params),
  },
  {
    Header: "Status",
    accessor: "status",
    Cell: TextCell,
    disableSortBy: true,
  },
];

export const rowsPageFromState = async (
  state: State<StreamsTableData>,
  userId: string,
  getStreams: Function
): Promise<RowsPageFromStateResult> => {
  let active: boolean;
  const filteredFilters = state.filters.filter((f) => {
    if (f.id === "isActive" && f.isOpen) {
      active = f.condition.value as boolean;
      return false;
    }
    return true;
  });
  const [streams, nextCursor, count] = await getStreams(userId, {
    active,
    filters: formatFiltersForApiRequest(filteredFilters),
    limit: state.pageSize.toString(),
    cursor: state.cursor,
    order: state.order,
    count: true,
  });

  const rows = streams.map((stream) => ({
    id: stream.id,
    name: {
      id: stream.id,
      value: stream.name,
      children: (
        <Link as="div" variant="primary">
          {stream.name}
        </Link>
      ),
      tooltipChildren: stream.createdByTokenName ? (
        <>
          Created by token <b>{stream.createdByTokenName}</b>
        </>
      ) : null,
      href: `/dashboard/streams/${stream.id}`,
    },
    details: { stream },
    createdAt: {
      date: new Date(stream.createdAt),
      fallback: <Box css={{ color: "$primary8" }}>—</Box>,
      href: `/dashboard/streams/${stream.id}`,
    },
    lastSeen: {
      date: stream.lastSeen ? new Date(stream.lastSeen) : null,
      fallback: <Box css={{ color: "$primary8" }}>—</Box>,
      href: `/dashboard/streams/${stream.id}`,
    },
    status: {
      children: stream.isActive ? "Active" : "Idle",
      href: `/dashboard/streams/${stream.id}`,
    },
  }));
  return { rows, nextCursor, count };
};

export const defaultCreateProfiles = [
  {
    name: "240p0",
    fps: 0,
    bitrate: 250000,
    width: 426,
    height: 240,
  },
  {
    name: "360p0",
    fps: 0,
    bitrate: 800000,
    width: 640,
    height: 360,
  },
  {
    name: "480p0",
    fps: 0,
    bitrate: 1600000,
    width: 854,
    height: 480,
  },
  {
    name: "720p0",
    fps: 0,
    bitrate: 3000000,
    width: 1280,
    height: 720,
  },
];
