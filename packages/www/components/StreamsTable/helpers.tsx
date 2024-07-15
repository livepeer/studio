import { Box, Text } from "@livepeer/design-system";
import { State } from "../Table";
import DateCell, { DateCellProps } from "../Table/cells/date";
import { RenditionDetailsCellProps } from "../Table/cells/streams-table";
import TextCell, { TextCellProps } from "../Table/cells/text";
import TableEmptyState from "../Table/components/TableEmptyState";
import { FilterItem, formatFiltersForApiRequest } from "../Table/filters";
import { stringSort, dateSort } from "../Table/sorts";
import { RowsPageFromStateResult, SortTypeArgs } from "../Table/types";
import { useProjectContext } from "context/ProjectContext";

export type StreamsTableData = {
  id: string;
  name: TextCellProps;
  details: RenditionDetailsCellProps;
  createdAt: DateCellProps;
  lastSeen: DateCellProps;
  status: TextCellProps;
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
  getStreams: Function,
  appendProjectId: Function
): Promise<RowsPageFromStateResult<StreamsTableData>> => {
  let active: boolean;
  let isHealthy: boolean;
  const filteredFilters = state.filters.filter((f) => {
    if (f.id === "isActive" && f.isOpen) {
      active = f.condition.value as boolean;
      return false;
    }

    return true;
  });
  const [streams, nextCursor, count, allStreamCount, activeStreamCount] =
    await getStreams(userId, {
      active,
      isHealthy,
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
      children: <Text size={2}>{stream.name}</Text>,
      tooltipChildren: stream.createdByTokenName
        ? `Created by token ${stream.createdByTokenName}`
        : null,
      href: appendProjectId(`/streams/${stream.id}`),
    },
    details: { stream },
    createdAt: {
      date: new Date(stream.createdAt),
      fallback: <Box css={{ color: "$neutral8" }}>—</Box>,
      href: appendProjectId(`/streams/${stream.id}`),
    },
    lastSeen: {
      date: stream.lastSeen ? new Date(stream.lastSeen) : null,
      fallback: <Box css={{ color: "$neutral8" }}>—</Box>,
      href: appendProjectId(`/streams/${stream.id}`),
    },
    status: {
      children: stream.isActive ? "Active" : "Idle",
      href: appendProjectId(`/streams/${stream.id}`),
    },
  }));
  return { rows, nextCursor, count, allStreamCount, activeStreamCount };
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

export const makeEmptyState = (actionToggleState) => (
  <TableEmptyState
    title="Create your first livestream"
    description="Create a livestream and go live using your favorite broadcasting software."
    learnMoreUrl="https://docs.livepeer.org/guides/developing/create-a-livestream"
    primaryActionTitle="Create livestream"
    secondaryActionTitle="See the developer guide"
    actionToggleState={actionToggleState}
  />
);
