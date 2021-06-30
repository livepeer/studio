import {
  Heading,
  Box,
  Flex,
  Button,
  Badge,
  Text,
  styled,
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  useSnackbar,
} from "@livepeer.com/design-system";
import ReactTooltip from "react-tooltip";
import { useCallback, useMemo, useState } from "react";
import { useApi } from "../../../hooks";
import Table, { useTableState, Fetcher } from "components/Dashboard/Table";
import {
  FilterItem,
  formatFiltersForApiRequest,
} from "components/Dashboard/Table/filters";
import { Stream } from "@livepeer.com/api";
import TextCell, { TextCellProps } from "components/Dashboard/Table/cells/text";
import { Column } from "react-table";
import DateCell, { DateCellProps } from "components/Dashboard/Table/cells/date";
import { RenditionDetailsCellProps } from "components/Dashboard/Table/cells/streams-table";
import { dateSort, stringSort } from "components/Dashboard/Table/sorts";
import { SortTypeArgs } from "components/Dashboard/Table/types";
import { QuestionMarkIcon, Cross1Icon, PlusIcon } from "@radix-ui/react-icons";
import Spinner from "@components/Dashboard/Spinner";
import { useToggleState } from "hooks/use-toggle-state";
import CreateStreamDialog from "./CreateStreamDialog";
import { useRouter } from "next/router";

type ProfileProps = {
  id: string;
  i: number;
  rendition: Rendition;
};

type Rendition = {
  width: number;
  name: string;
  height: number;
  bitrate: number;
  fps: number;
};

const filterItems: FilterItem[] = [
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

const StyledQuestionMarkIcon = styled(QuestionMarkIcon, {
  color: "$gray8",
  cursor: "pointer",
  ml: "$1",
});

const Profile = ({
  id,
  i,
  rendition: { fps, name, width, height, bitrate },
}: ProfileProps) => {
  return (
    <Box
      id={`profile-${id}-${i}-${name}`}
      key={`profile-${id}-${i}-${name}`}
      css={{
        padding: "0.5em",
        display: "grid",
        alignItems: "space-around",
        gridTemplateColumns: "auto auto",
      }}>
      <Box>name:</Box>
      <Box>{name}</Box>
      <Box>fps:</Box>
      <Box>{fps}</Box>
      <Box>width:</Box>
      <Box>{width}</Box>
      <Box>height:</Box>
      <Box>{height}</Box>
      <Box>bitrate:</Box>
      <Box>{bitrate}</Box>
    </Box>
  );
};

export const RenditionsDetails = ({ stream }: { stream: Stream }) => {
  let details = "";
  let detailsTooltip;
  if (stream.presets?.length) {
    details = `${stream.presets}`;
  }
  if (stream.profiles?.length) {
    if (details) {
      details += "/";
    }
    details += stream.profiles
      .map(({ height, fps }) => {
        if (fps === 0) {
          return `${height}pSourceFPS`;
        }
        return `${height}p${fps}`;
      })
      .join(",\u{200B}");
    detailsTooltip = (
      <Flex>
        {stream.profiles.map((p, i) => (
          <Profile key={i} id={stream.id} i={i} rendition={p} />
        ))}
      </Flex>
    );
    detailsTooltip = null; // remove for now, will be back later
  }
  return (
    <Flex>
      <Box>{details}</Box>
      {detailsTooltip ? (
        <Flex css={{ alignItems: "center" }}>
          <Flex>
            <ReactTooltip
              id={`tooltip-details-${stream.id}`}
              className="tooltip"
              place="top"
              type="dark"
              effect="solid">
              {detailsTooltip}
            </ReactTooltip>
            <StyledQuestionMarkIcon
              data-tip
              data-for={`tooltip-details-${stream.id}`}
              css={{
                color: "$mauve7",
                cursor: "pointer",
                ml: 1,
              }}
            />
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  );
};

type StreamsTableData = {
  id: string;
  name: TextCellProps;
  details: RenditionDetailsCellProps;
  created: DateCellProps;
  lastActive: DateCellProps;
  status: TextCellProps;
};

const StreamsTable = ({
  title = "Streams",
  pageSize = 20,
  userId,
}: {
  title: string;
  pageSize?: number;
  userId: string;
}) => {
  const router = useRouter();
  const { getStreams, deleteStream, deleteStreams, createStream } = useApi();
  const [openSnackbar] = useSnackbar();
  const [savingDeleteDialog, setSavingDeleteDialog] = useState(false);
  const deleteDialogState = useToggleState();
  const createDialogState = useToggleState();
  const { state, stateSetter } = useTableState<StreamsTableData>({
    pageSize,
  });

  const columns: Column<StreamsTableData>[] = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name",
        Cell: TextCell,
        sortType: (...params: SortTypeArgs) =>
          stringSort("original.name.children", ...params),
      },
      {
        Header: "Created",
        accessor: "created",
        Cell: DateCell,
        sortType: (...params: SortTypeArgs) =>
          dateSort("original.created.date", ...params),
      },
      {
        Header: "Last seen",
        accessor: "lastActive",
        Cell: DateCell,
        sortType: (...params: SortTypeArgs) =>
          dateSort("original.lastActive.date", ...params),
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: TextCell,
        disableSortBy: true,
      },
    ],
    []
  );

  const fetcher: Fetcher<StreamsTableData> = useCallback(
    async (state) => {
      let active: string | undefined;
      const filteredFilters = state.filters.filter((f) => {
        if (f.id === "isActive" && f.isOpen) {
          active = f.condition.value as string;
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
      const rows = streams.map((stream) => {
        return {
          id: stream.id,
          name: {
            id: stream.id,
            children: stream.name,
            tooltipChildren: stream.createdByTokenName ? (
              <>
                Created by token <b>{stream.createdByTokenName}</b>
              </>
            ) : null,
            href: `/dashboard/streams/${stream.id}`,
          },
          details: { stream },
          created: {
            date: new Date(stream.createdAt),
            fallback: <Box css={{ color: "$mauve8" }}>—</Box>,
            href: `/dashboard/streams/${stream.id}`,
          },
          lastActive: {
            date: stream.lastSeen ? new Date(stream.lastSeen) : null,
            fallback: <Box css={{ color: "$mauve8" }}>—</Box>,
            href: `/dashboard/streams/${stream.id}`,
          },
          status: {
            children: stream.isActive ? "Active" : "Idle",
            href: `/dashboard/streams/${stream.id}`,
          },
        };
      });
      return { rows, nextCursor, count };
    },
    [userId]
  );

  const onDeleteStreams = useCallback(async () => {
    if (state.selectedRows.length === 1) {
      await deleteStream(state.selectedRows[0].id);
      await state.queryState?.invalidate();
      deleteDialogState.onOff();
    } else if (state.selectedRows.length > 1) {
      await deleteStreams(state.selectedRows.map((s) => s.id));
      await state.queryState?.invalidate();
      deleteDialogState.onOff();
    }
  }, [
    deleteStream,
    deleteStreams,
    deleteDialogState.onOff,
    state.selectedRows.length,
    state.queryState?.invalidate()
  ]);

  return (
    <>
      <Table
        tableId="streams"
        columns={columns}
        fetcher={fetcher}
        state={state}
        stateSetter={stateSetter}
        rowSelection="all"
        filterItems={filterItems}
        header={
          <Heading size="2">
            <Flex>
              <Box css={{ mr: "$3", fontWeight: 600, letterSpacing: 0 }}>
                {title}
              </Box>
              <Badge
                size="1"
                variant="violet"
                css={{ letterSpacing: 0, mt: "7px" }}>
                1 active right now
              </Badge>
            </Flex>
          </Heading>
        }
        initialSortBy={[{ id: "created", desc: true }]}
        selectAction={{
          onClick: deleteDialogState.onOn,
          children: (
            <>
              <Cross1Icon />{" "}
              <Box css={{ ml: "$2" }} as="span">
                Delete
              </Box>
            </>
          ),
        }}
        createAction={{
          onClick: createDialogState.onOn,
          variant: "violet",
          css: { display: "flex", alignItems: "center" },
          children: (
            <>
              <PlusIcon />{" "}
              <Box as="span" css={{ ml: "$2" }}>
                Create stream
              </Box>
            </>
          ),
        }}
      />

      {/* Delete streams dialog */}
      <AlertDialog open={deleteDialogState.on}>
        <AlertDialogContent
          css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
          <AlertDialogTitle as={Heading} size="1">
            Delete {state.selectedRows.length} stream
            {state.selectedRows.length > 1 && "s"}?
          </AlertDialogTitle>
          <AlertDialogDescription
            as={Text}
            size="3"
            variant="gray"
            css={{ mt: "$2", lineHeight: "22px" }}>
            This will permanently remove the stream
            {state.selectedRows.length > 1 && "s"}. This action cannot be
            undone.
          </AlertDialogDescription>

          <Flex css={{ jc: "flex-end", gap: "$3", mt: "$5" }}>
            <AlertDialogCancel
              size="2"
              onClick={deleteDialogState.onOff}
              as={Button}
              ghost>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              as={Button}
              size="2"
              disabled={savingDeleteDialog}
              onClick={async () => {
                try {
                  setSavingDeleteDialog(true);
                  await onDeleteStreams();
                  openSnackbar(
                    `${state.selectedRows.length} stream${
                      state.selectedRows.length > 1 ? "s" : ""
                    } deleted.`
                  );
                  setSavingDeleteDialog(false);
                  deleteDialogState.onOff();
                } catch (e) {
                  setSavingDeleteDialog(false);
                }
              }}
              variant="red">
              {savingDeleteDialog && (
                <Spinner
                  css={{
                    color: "$hiContrast",
                    width: 16,
                    height: 16,
                    mr: "$2",
                  }}
                />
              )}
              Delete
            </AlertDialogAction>
          </Flex>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create stream dialog */}
      <CreateStreamDialog
        isOpen={createDialogState.on}
        onOpenChange={createDialogState.onToggle}
        onCreate={async (streamName) => {
          const newStream = await createStream({
            name: streamName,
            profiles: [
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
            ],
          });
          await state.queryState?.invalidate();
          const query = router.query.admin === "true" ? { admin: true } : {};
          await router.push({
            pathname: `/dashboard/streams/${newStream.id}`,
            query,
          });
        }}
      />
    </>
  );
};

export default StreamsTable;
