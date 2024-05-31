import { Asset } from "@livepeer.studio/api";
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
import { useProjectContext } from "context/ProjectContext";

type ApiClient = ReturnType<typeof useApi>;

const liveStreamHosts = ["livepeercdn.com", "cdn.livepeer.com"];

export const filterItems: FilterItem[] = [
  { label: "Name", id: "name", type: "text" },
  { label: "Created", id: "createdAt", type: "date" },
  { label: "Updated", id: "updatedAt", type: "date" },
  { label: "Source", id: "sourceSessionId", type: "text" },
  { label: "Source Type", id: "sourceType", type: "text" },
];

export type AssetsTableData = {
  id: string;
  name: NameCellProps;
  type: TextCellProps;
  sessionId: TextCellProps;
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
    Header: "Source Type",
    accessor: "type",
    Cell: TextCell,
    disableSortBy: true,
  },
  {
    Header: "Source",
    accessor: "sessionId",
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

export const hasLivestreamImportTask = (tasks: Task[], assetId: string) => {
  try {
    const task: Task =
      tasks && tasks.find((task: Task) => task.outputAssetId === assetId);
    const sourceUrl = get(task, "params.import.url");
    if (!sourceUrl) return false;

    const sourceHost = new URL(sourceUrl).host;
    return liveStreamHosts.includes(sourceHost);
  } catch (err) {
    console.error("Error in checking import tasks: ", err);
    return false;
  }
};

export const rowsPageFromState = async (
  state: State<AssetsTableData>,
  userId: string,
  getAssets: ApiClient["getAssets"],
  getTasks: ApiClient["getTasks"],
  onDeleteAsset: Function,
  appendProjectId: Function
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
      const isLiveStream = asset.source?.type
        ? asset.source.type === "recording"
        : hasLivestreamImportTask(tasks, asset.id);
      const isClip = asset.source?.type ? asset.source.type === "clip" : false;
      let sessionId: string = "";
      if (asset.source?.type === "clip") {
        sessionId = asset.source?.sessionId;
      }
      if (asset.source?.type === "recording") {
        sessionId = asset.source?.sessionId;
      }
      const isStatusFailed = asset.status?.phase === "failed";
      const { errorMessage } = asset.status;

      return {
        id: asset.id,
        name: {
          id: asset.id,
          href: appendProjectId(`/assets/${asset.id}`),
          name: asset.name,
          isStatusFailed,
          errorMessage,
        },
        type: {
          children: (
            <Box>
              {isLiveStream ? "Live Stream" : isClip ? "Clip" : "Upload"}
            </Box>
          ),
          fallback: <Box css={{ color: "$primary8" }}>—</Box>,
          href: appendProjectId(`/assets/${asset.id}`),
        },
        sessionId: {
          children: <Box>{sessionId}</Box>,
          fallback: <Box css={{ color: "$primary8" }}>—</Box>,
          href: appendProjectId(`/sessions?sessionId=${sessionId}`),
        },
        createdAt: {
          id: asset.id,
          date: new Date(asset.createdAt),
          fallback: <Box css={{ color: "$primary8" }}>—</Box>,
          href: appendProjectId(`/assets/${asset.id}`),
          asset: asset as Asset, // CreatedAt cell expect SDK asset instead of API
        },
        updatedAt: {
          date:
            asset.status.updatedAt && asset.status.updatedAt !== asset.createdAt
              ? new Date(asset.status.updatedAt)
              : null,
          fallback: <Box css={{ color: "$primary8" }}>—</Box>,
          href: appendProjectId(`/assets/${asset.id}`),
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
    description="Upload video assets for optimized playback."
    learnMoreUrl="https://docs.livepeer.org/guides/developing/upload-a-video-asset"
    secondaryActionTitle="See the developer guide"
    primaryActionTitle="Upload asset"
    actionToggleState={actionToggleState}
  />
);
