import { Asset } from "livepeer";
import { Asset as ApiAsset, Task } from "@livepeer.studio/api";
import { Box } from "@livepeer/design-system";
import { FileUpload } from "hooks/use-api/types";
import { get } from "lodash";
import ActionCell, { ActionCellProps } from "../Table/cells/action";
import CreatedAtCell, { CreatedAtCellProps } from "../Table/cells/createdAt";
import DateCell, { DateCellProps } from "../Table/cells/date";
import NameCell, { NameCellProps } from "../Table/cells/name";
import TextCell, { TextCellProps } from "../Table/cells/text";
import { FilterItem, formatFiltersForApiRequest } from "../Table/filters";
import { stringSort, dateSort } from "../Table/sorts";
import { RowsPageFromStateResult, SortTypeArgs } from "../Table/types";
import { State } from "../Table";
import TableEmptyState from "../Table/components/TableEmptyState";
import { useApi } from "hooks";

type ApiClient = ReturnType<typeof useApi>;

const liveStreamHosts = ["livepeercdn.com", "cdn.livepeer.com"];

export const filterItems: FilterItem[] = [
  { label: "Name", id: "name", type: "text" },
  { label: "Created", id: "createdAt", type: "date" },
  { label: "Updated", id: "updatedAt", type: "date" },
];

export type AssetsTableData = {
  id: string;
  name: NameCellProps;
  source: TextCellProps;
  createdAt: CreatedAtCellProps;
  updatedAt: DateCellProps;
  action: ActionCellProps;
};

export const makeColumns = () => [
  {
    Header: "Name",
    accessor: "name",
    Cell: NameCell,
    sortType: (...params: SortTypeArgs) =>
      stringSort("original.name.value", ...params),
  },
  {
    Header: "Created",
    accessor: "createdAt",
    Cell: CreatedAtCell,
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
    width: "$5",
  },
];

export const rowsPageFromState = async (
  state: State<AssetsTableData>,
  userId: string,
  getAssets: ApiClient["getAssets"],
  getTasks: ApiClient["getTasks"],
  onDeleteAsset: Function
): Promise<RowsPageFromStateResult<AssetsTableData>> => {
  const assetsPromise = getAssets(userId, {
    filters: formatFiltersForApiRequest(state.filters),
    limit: state.pageSize.toString(),
    cursor: state.cursor,
    order: state.order,
    count: true,
  });
  const tasksPromise = getTasks(userId, {
    limit: state.pageSize.toString(),
  });
  const [[assets, nextCursor, count], [tasks]] = await Promise.all([
    assetsPromise,
    tasksPromise,
  ]);

  const rows: AssetsTableData[] = assets.map(
    (asset: ApiAsset): AssetsTableData => {
      const source: Task =
        tasks && tasks.find((task: Task) => task.outputAssetId === asset.id);
      const sourceUrl = get(source, "params.import.url");
      const sourceHost = sourceUrl && new URL(sourceUrl).host;
      const isLiveStream = !!sourceUrl && liveStreamHosts.includes(sourceHost);

      const isStatusFailed = asset.status?.phase === "failed";
      const { errorMessage } = asset.status;

      return {
        id: asset.id,
        name: {
          id: asset.id,
          href: `/dashboard/assets/${asset.id}`,
          name: asset.name,
          isStatusFailed,
          errorMessage,
        },
        source: {
          children: <Box>{isLiveStream ? "Live Stream" : "Upload"}</Box>,
          fallback: <Box css={{ color: "$primary8" }}>—</Box>,
          href: `/dashboard/assets/${asset.id}`,
        },
        createdAt: {
          id: asset.id,
          date: new Date(asset.createdAt),
          fallback: <Box css={{ color: "$primary8" }}>—</Box>,
          href: `/dashboard/assets/${asset.id}`,
          asset: asset as Asset, // CreatedAt cell expect SDK asset instead of API
        },
        updatedAt: {
          date:
            asset.status.updatedAt && asset.status.updatedAt !== asset.createdAt
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
    }
  );
  return { rows, nextCursor, count };
};

export const fileUploadProgressForAsset = (
  asset: Asset,
  fileUploads: FileUpload[]
): number | undefined => {
  const fileUpload = fileUploads.find(
    (upload) => upload.file.name === asset.name
  );
  return fileUpload && asset.status?.phase === "waiting"
    ? (fileUpload.completed ? 1 : 0.99) * fileUpload.progress
    : undefined;
};

export const makeEmptyState = (actionToggleState) => (
  <TableEmptyState
    title="Upload your first video asset"
    description="Upload video assets for optimized and cached on-demand playback."
    learnMoreUrl="https://docs.livepeer.studio/category/on-demand"
    actionTitle="Upload asset"
    actionToggleState={actionToggleState}
  />
);
