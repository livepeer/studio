import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, PlusIcon, Cross1Icon } from "@radix-ui/react-icons";
import { useApi } from "hooks";
import Table, { useTableState, Fetcher } from "components/Dashboard/Table";
import { FilterItem } from "components/Dashboard/Table/filters";
import TextCell, { TextCellProps } from "components/Dashboard/Table/cells/text";
import DateCell, { DateCellProps } from "components/Dashboard/Table/cells/date";
import { SortTypeArgs } from "components/Dashboard/Table/types";
import { dateSort, stringSort } from "components/Dashboard/Table/sorts";
import { Column } from "react-table";
import {
  CellComponentProps,
  TableData,
} from "components/Dashboard/Table/types";
import {
  Flex,
  Heading,
  Link as A,
  Button,
  Text,
  Box,
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  useSnackbar,
} from "@livepeer.com/design-system";
import Spinner from "components/Dashboard/Spinner";
import { useToggleState } from "hooks/use-toggle-state";
import CreateAssetDialog from "./CreateAssetDialog";

const filterItems: FilterItem[] = [
  { label: "Name", id: "name", type: "text" },
  { label: "Created", id: "createdAt", type: "date" },
  { label: "Updated", id: "updatedAt", type: "date" },
];

type AssetsTableData = {
  id: string;
  name: TextCellProps;
  createdAt: DateCellProps;
  updatedAt: DateCellProps;
  downloadUrl: TextCellProps;
};

export type DownloadUrlCellProps = {
  children?: React.ReactNode;
  id?: string;
};

const downloadUrlCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, DownloadUrlCellProps>) => (
  <A
    variant="violet"
    target="_blank"
    href={cell.value.children as string}
    id={`mp4-link-dropdown-${cell.value.id}`}>
    {cell.value.children}
  </A>
);

const AssetsTable = ({
  userId,
  title = "Video on Demand Assets",
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
  const { getAssets, createAsset, deleteAsset, deleteAssets } = useApi();
  const [openSnackbar] = useSnackbar();
  const createDialogState = useToggleState();
  const deleteDialogState = useToggleState();
  const [savingDeleteDialog, setSavingDeleteDialog] = useState(false);
  const { state, stateSetter } = useTableState<AssetsTableData>({
    pageSize,
    tableId,
  });

  const columns: Column<AssetsTableData>[] = useMemo(
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
        Header: "Download URL",
        accessor: "downloadUrl",
        Cell: downloadUrlCell,
        disableSortBy: true,
      },
    ],
    []
  );

  const fetcher: Fetcher<AssetsTableData> = useCallback(
    async (state) => {
      const [assets, nextCursor, count] = await getAssets(userId, {
        limit: state.pageSize.toString(),
        cursor: state.cursor,
        order: state.order,
        count: true,
      });
      const rows = assets.map((asset) => {
        return {
          id: asset.id,
          name: {
            id: asset.id,
            value: asset.name,
            children: asset.name,
          },
          createdAt: {
            date: new Date(asset.createdAt),
            fallback: <Box css={{ color: "$mauve8" }}>—</Box>,
          },
          updatedAt: {
            date: asset.updatedAt ? new Date(asset.updatedAt) : null,
            fallback: <Box css={{ color: "$mauve8" }}>—</Box>,
          },
          downloadUrl: {
            id: asset.id,
            children: asset.downloadUrl,
          },
        };
      });
      return { rows, nextCursor, count };
    },
    [userId]
  );

  const onDeleteAssets = useCallback(async () => {
    if (state.selectedRows.length === 1) {
      await deleteAsset(state.selectedRows[0].id);
      await state.invalidate();
      deleteDialogState.onOff();
    } else if (state.selectedRows.length > 1) {
      await deleteAssets(state.selectedRows.map((s) => s.id));
      await state.invalidate();
      deleteDialogState.onOff();
    }
  }, [
    deleteAsset,
    deleteAssets,
    deleteDialogState.onOff,
    state.selectedRows.length,
    state.invalidate,
  ]);

  const emptyState = (
    <Flex
      direction="column"
      justify="center"
      css={{
        margin: "0 auto",
        height: "calc(100vh - 400px)",
        maxWidth: 450,
      }}>
      <Flex
        direction="column"
        justify="center"
        css={{
          margin: "0 auto",
          height: "calc(100vh - 400px)",
          maxWidth: 450,
        }}>
        <Heading css={{ fontWeight: 500, mb: "$3" }}>
          Create Video on Demand Assets
        </Heading>
        <Text variant="gray" css={{ lineHeight: 1.5, mb: "$3" }}>
          Livepeer Video Services now supports Video on Demand which allows you
          to import video assets, store them on decentralized storage, and
          easily mint a video NFT. This functionality is currently in beta and
          available only on the API.
        </Text>

        <Box
          css={{
            display: "block",
            "@bp1": {
              display: "flex",
            },
          }}>
          <Link href="/docs/api-reference/vod/import" passHref>
            <A
              target="_blank"
              variant="violet"
              css={{ display: "flex", ai: "center", mb: "$5" }}>
              <Box>Learn more</Box>
              <ArrowRightIcon />
            </A>
          </Link>
        </Box>
        <Button
          onClick={() => createDialogState.onOn()}
          css={{ alignSelf: "flex-start" }}
          size="2"
          variant="violet">
          <PlusIcon />{" "}
          <Box as="span" css={{ ml: "$2" }}>
            Create asset
          </Box>
        </Button>
      </Flex>
    </Flex>
  );

  return (
    <>
      <Table
        columns={columns}
        fetcher={fetcher}
        state={state}
        stateSetter={stateSetter}
        rowSelection="all"
        filterItems={!viewAll && filterItems}
        emptyState={emptyState}
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
                Create asset
              </Box>
            </>
          ),
        }}
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
      />
      <CreateAssetDialog
        isOpen={createDialogState.on}
        onOpenChange={createDialogState.onToggle}
        onCreate={async (assetData) => {
          const newAsset = await createAsset({
            name: assetData.name,
            url: assetData.url,
          });
          await state.invalidate();
          createDialogState.onOff();
          openSnackbar(`${assetData.name} asset created.`);
        }}
      />

      <AlertDialog
        open={deleteDialogState.on}
        onOpenChange={deleteDialogState.onOff}>
        <AlertDialogContent
          css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
          <AlertDialogTitle as={Heading} size="1">
            Delete {state.selectedRows.length} asset
            {state.selectedRows.length > 1 && "s"}?
          </AlertDialogTitle>
          <AlertDialogDescription
            as={Text}
            size="3"
            variant="gray"
            css={{ mt: "$2", lineHeight: "22px" }}>
            This will permanently remove the asset
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
              onClick={async (e) => {
                try {
                  e.preventDefault();
                  setSavingDeleteDialog(true);
                  await onDeleteAssets();
                  openSnackbar(
                    `${state.selectedRows.length} asset${
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
    </>
  );
};

export default AssetsTable;
