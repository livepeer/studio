import { useCallback, useMemo } from "react";
import { get } from "lodash";
import { PlusIcon } from "@radix-ui/react-icons";
import { useApi } from "hooks";
import Table, { useTableState, Fetcher } from "components/Dashboard/Table";
import {
  FilterItem,
  formatFiltersForApiRequest,
} from "components/Dashboard/Table/filters";
import TextCell, { TextCellProps } from "components/Dashboard/Table/cells/text";
import DateCell, { DateCellProps } from "components/Dashboard/Table/cells/date";
import { SortTypeArgs } from "components/Dashboard/Table/types";
import { dateSort, stringSort } from "components/Dashboard/Table/sorts";
import { Flex, Heading, Box, useSnackbar } from "@livepeer/design-system";
import { useToggleState } from "hooks/use-toggle-state";
import CreateAssetDialog from "./CreateAssetDialog";
import EmptyState from "./EmptyState";
import ActionCell, { ActionCellProps } from "../Table/cells/action";
import { displayReadyAssetName, makeNameSectionChildren } from "./helpers";

const filterItems: FilterItem[] = [
  { label: "Name", id: "name", type: "text" },
  { label: "Created", id: "createdAt", type: "date" },
  { label: "Updated", id: "updatedAt", type: "date" },
];

type AssetsTableData = {
  id: string;
  name: TextCellProps;
  source: TextCellProps;
  createdAt: DateCellProps;
  updatedAt: DateCellProps;
  action: ActionCellProps;
};

const AssetsTable = ({
  userId,
  title = "Assets",
  pageSize = 20,
  tableId,
  viewAll,
}: {
  userId: string;
  title?: string;
  pageSize?: number;
  tableId: string;
  viewAll?: string;
}) => {
  const { getAssets, uploadAssets, getTasks } = useApi();
  const [openSnackbar] = useSnackbar();
  const createDialogState = useToggleState();
  const { state, stateSetter } = useTableState<AssetsTableData>({
    pageSize,
    tableId,
  });

  const columns = useMemo(
    () => [
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
        Header: "Updated",
        accessor: "updatedAt",
        Cell: DateCell,
        sortType: (...params: SortTypeArgs) =>
          dateSort("original.updatedAt.date", ...params),
      },
      {
        Header: "Source",
        accessor: "source",
        Cell: TextCell,
        disableSortBy: true,
      },
      {
        Header: "",
        accessor: "action",
        Cell: ActionCell,
        disableSortBy: true,
        width: "$7", // TODO: maybe $7
      },
    ],
    []
  );

  const onDeleteAsset = (id: string) => {
    console.log("Delete assed id: ", id);
  };

  const fetcher: Fetcher<AssetsTableData> = useCallback(
    async (state) => {
      const [assets, nextCursor, count] = await getAssets(userId, {
        filters: formatFiltersForApiRequest(state.filters),
        limit: state.pageSize.toString(),
        cursor: state.cursor,
        order: state.order,
        count: true,
      });

      const [tasks] = await getTasks(userId);

      const rows = assets.map((asset) => {
        const source =
          tasks && tasks.find((task) => task.outputAssetId === asset.id);
        const sourceUrl = get(source, "params.import.url");
        const isStatusFailed = asset.status.phase === "failed";
        const displayName = displayReadyAssetName(asset.name);
        const nameSectionChildren = makeNameSectionChildren(
          isStatusFailed,
          displayName
        );

        return {
          id: asset.id,
          name: {
            id: asset.id,
            value: asset.name,
            children: nameSectionChildren,
            href: `/dashboard/assets/${asset.id}`,
          },
          source: {
            children: (
              <Box>
                {sourceUrl &&
                (sourceUrl.indexOf("https://livepeercdn.com") === 0 ||
                  sourceUrl.indexOf("https://cdn.livepeer.com") === 0)
                  ? "Live Stream"
                  : "Upload"}
              </Box>
            ),
            fallback: <Box css={{ color: "$primary8" }}>—</Box>,
            href: `/dashboard/assets/${asset.id}`,
          },
          createdAt: {
            id: asset.id,
            date: new Date(asset.createdAt),
            fallback: <Box css={{ color: "$primary8" }}>—</Box>,
            href: `/dashboard/assets/${asset.id}`,
            isStatusFailed,
            errorMessage: asset.status.errorMessage,
          },
          updatedAt: {
            date:
              asset.status.updatedAt &&
              asset.status.updatedAt !== asset.createdAt
                ? new Date(asset.status.updatedAt)
                : null,
            fallback: <Box css={{ color: "$primary8" }}>—</Box>,
            href: `/dashboard/assets/${asset.id}`,
          },
          action: {
            id: asset.id,
            isStatusFailed,
            onDelete: () => onDeleteAsset(asset.id),
          },
        };
      });
      return { rows, nextCursor, count };
    },
    [userId]
  );

  return (
    <>
      <Table
        columns={columns}
        fetcher={fetcher}
        fetcherOptions={{ refetchInterval: 15000 }}
        state={state}
        stateSetter={stateSetter}
        filterItems={!viewAll && filterItems}
        emptyState={<EmptyState createDialogState={createDialogState} />}
        viewAll={viewAll}
        header={
          <Heading size="2">
            <Flex>
              <Box css={{ mr: "$3", fontWeight: 600, letterSpacing: 0 }}>
                {title}
              </Box>
            </Flex>
          </Heading>
        }
        initialSortBy={[{ id: "createdAt", desc: true }]}
        createAction={{
          onClick: createDialogState.onOn,
          css: { display: "flex", alignItems: "center", ml: "$1" },
          children: (
            <>
              <PlusIcon />{" "}
              <Box as="span" css={{ ml: "$2" }}>
                Upload asset
              </Box>
            </>
          ),
        }}
      />
      <CreateAssetDialog
        isOpen={createDialogState.on}
        onOpenChange={createDialogState.onToggle}
        onCreate={async ({ videoFiles }: { videoFiles: File[] }) => {
          try {
            await uploadAssets(videoFiles);
            await state.invalidate();
            createDialogState.onOff();
          } catch (e) {
            openSnackbar(`Error with uploading videos, please try again.`);
          }
        }}
      />
    </>
  );
};

export default AssetsTable;
