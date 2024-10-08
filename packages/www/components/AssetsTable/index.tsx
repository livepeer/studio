import { useCallback, useEffect, useMemo } from "react";
import { useApi } from "hooks";
import Table, {
  useTableState,
  Fetcher,
  sortByToString,
  DefaultSortBy,
} from "components/Table";
import { useSnackbar } from "@livepeer/design-system";
import { useToggleState } from "hooks/use-toggle-state";
import CreateAssetDialog from "./CreateAssetDialog";
import TableStateDeleteDialog from "../Table/components/TableStateDeleteDialog";
import {
  AssetsTableData,
  filterItems,
  makeColumns,
  makeEmptyState,
  rowsPageFromState,
} from "./helpers";
import { makeCreateAction, makeSelectAction } from "../Table/helpers";
import { useProjectContext } from "context/ProjectContext";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const {
    getAssets,
    uploadAssets,
    deleteAsset,
    deleteAssets,
    getTasks,
    getFileUploads,
  } = useApi();
  const [openSnackbar] = useSnackbar();
  const { appendProjectId, projectId } = useProjectContext();
  const createDialogState = useToggleState();
  const deleteDialogState = useToggleState();
  const { state, stateSetter } = useTableState<AssetsTableData>({
    pageSize,
    tableId,
    initialOrder: sortByToString(DefaultSortBy),
  });
  const columns = useMemo(makeColumns, []);

  const onDeleteAsset = useCallback(
    async (assetId: string) => {
      try {
        await deleteAsset(assetId);
        await state.invalidate();
        openSnackbar("Asset deleted successfully.");
      } catch (error) {
        console.error("Error deleting asset:", error);
        openSnackbar("Error deleting asset. Please try again.");
      }
    },
    [deleteAsset, state, openSnackbar],
  );

  const onUploadAssetSuccess = () => sleep(2000).then(() => state.invalidate());

  const onCreate = async ({ videoFiles }: { videoFiles: File[] }) => {
    try {
      await uploadAssets(videoFiles, onUploadAssetSuccess);
      await state.invalidate();
      createDialogState.onOff();
    } catch (e) {
      openSnackbar(`Error with uploading videos, please try again.`);
      return;
    }

    // Show errors for any files that failed to request upload
    getFileUploads()
      .filter((fileUpload) => fileUpload.error !== undefined)
      .forEach((fileUpload) => openSnackbar(fileUpload.error.message));
  };

  const fetcher: Fetcher<AssetsTableData> = useCallback(
    async (state) =>
      rowsPageFromState(
        state,
        userId,
        getAssets,
        getTasks,
        onDeleteAsset,
        appendProjectId,
      ),
    [userId, appendProjectId],
  );

  useEffect(() => {
    stateSetter.setProjectId(projectId);
  }, [projectId]);

  return (
    <>
      <Table
        title={title}
        columns={columns}
        fetcher={fetcher}
        fetcherOptions={{ refetchInterval: 15000 }}
        state={state}
        stateSetter={stateSetter}
        filterItems={!viewAll && filterItems}
        viewAll={viewAll}
        initialSortBy={[DefaultSortBy]}
        emptyState={makeEmptyState(createDialogState)}
        createAction={makeCreateAction("Upload asset", createDialogState.onOn)}
        rowSelection="all"
        selectAction={makeSelectAction("Delete", deleteDialogState.onOn)}
      />

      <CreateAssetDialog
        isOpen={createDialogState.on}
        onOpenChange={createDialogState.onToggle}
        onCreate={onCreate}
      />

      <TableStateDeleteDialog
        entityName={{ singular: "asset", plural: "assets" }}
        state={state}
        dialogToggleState={deleteDialogState}
        deleteFunction={deleteAsset}
        deleteMultipleFunction={deleteAssets}
      />
    </>
  );
};

export default AssetsTable;
