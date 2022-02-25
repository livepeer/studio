import { useCallback, useMemo } from "react";
import { useApi } from "../../../hooks";
import Table, { Fetcher, useTableState } from "components/Dashboard/Table";
import { FilterItem, formatFiltersForApiRequest } from "../Table/filters";
import TextCell, { TextCellProps } from "components/Dashboard/Table/cells/text";
import DateCell, { DateCellProps } from "components/Dashboard/Table/cells/date";
import {
  dateSort,
  numberSort,
  stringSort,
} from "components/Dashboard/Table/sorts";
import Link from "next/link";
import { SortTypeArgs } from "components/Dashboard/Table/types";
import { Column } from "react-table";
import { Cross1Icon, PlusIcon } from "@radix-ui/react-icons";
import { useToggleState } from "hooks/use-toggle-state";
import ImportVideoDialog from "./ImportVideoDialog";
import { useRouter } from "next/router";
import {
  CellComponentProps,
  TableData,
} from "components/Dashboard/Table/types";
import { truncate } from "../../../lib/utils";
import {
  Box,
  Flex,
  Heading,
  Link as A,
  Text,
  HoverCardRoot,
  HoverCardContent,
  HoverCardTrigger,
  useSnackbar,
} from "@livepeer.com/design-system";
import { ArrowRightIcon, CopyIcon } from "@radix-ui/react-icons";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Asset } from "@livepeer.com/api";

function makeMP4Url(hlsUrl: string, profileName: string): string {
  const pp = hlsUrl.split("/");
  pp.pop();
  return pp.join("/") + "/" + profileName + ".mp4";
}

function groupAssetsBySourceAsset(assets: Array<Asset>) {
  let grouped = {};
  assets.forEach((asset) => {
    if (!asset.sourceAssetId) {
      grouped[asset.id] = asset;
      grouped[asset.id].childrenAssets = [];
    }
  });
  assets.forEach((asset) => {
    if (asset.sourceAssetId) {
      grouped[asset.sourceAssetId].childrenAssets.push(asset);
    }
  });
  return grouped;
}

type Profile = { name: string; width: number; height: number };
export type DownloadUrlCellProps = {
  children?: React.ReactNode;
  tooltipChildren?: React.ReactNode;
  mp4Url?: string;
  id?: string;
  profiles?: Array<Profile>;
  showMP4: boolean;
};

const DownloadUrlCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, DownloadUrlCellProps>) => {
  const id = cell.value.id;
  return (
    <Box id={`mp4-link-dropdown-${id}`} css={{ position: "relative" }}>
      {cell.value.mp4Url ? (
        <Flex css={{ ai: "center", justifyContent: "space-between" }}>
          {cell.value.children}
          {cell.value.showMP4 && cell.value.profiles?.length ? (
            <A
              variant="violet"
              target="_blank"
              href={makeMP4Url(cell.value.mp4Url, "source")}>
              Download mp4
            </A>
          ) : null}
        </Flex>
      ) : (
        truncate(cell.value.children, 20)
      )}
    </Box>
  );
};

const filterItems: FilterItem[] = [
  { label: "Created Date", id: "createdAt", type: "date" },
];

type AssetsTableData = {
  id: string;
  createdAt: DateCellProps;
  metadata: TextCellProps;
  name: TextCellProps;
  source: TextCellProps;
  downloadUrl: TextCellProps;
};

const assetsTable = ({
  title = "Assets",
  pageSize = 20,
  tableId,
  userId,
  viewAll,
}: {
  title: string;
  pageSize?: number;
  userId: string;
  tableId: string;
  viewAll?: string;
}) => {
  const router = useRouter();
  const { user, getVodAssetsByUserId, getVodTasksByUserId, importVideo } =
    useApi();
  const deleteDialogState = useToggleState();
  const createDialogState = useToggleState();
  const tableProps = useTableState({
    tableId: "assetsTable",
  });

  const { state, stateSetter } = useTableState<AssetsTableData>({
    pageSize,
    tableId,
  });

  const [openSnackbar] = useSnackbar();

  const columns: Column<AssetsTableData>[] = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name",
        Cell: TextCell,
      },
      {
        Header: "Source",
        accessor: "source",
        Cell: TextCell,
      },
      {
        Header: "Created at",
        accessor: "createdAt",
        Cell: DateCell,
        sortType: (...params: SortTypeArgs) =>
          dateSort("original.createdAt.date", ...params),
      },
      {
        Header: "Download URL",
        accessor: "downloadUrl",
        Cell: DownloadUrlCell,
        disableSortBy: true,
      },
      {
        Header: "Metadata",
        accessor: "metadata",
        Cell: TextCell,
        disableSortBy: true,
      },
    ],
    []
  );

  const fetcher: Fetcher<AssetsTableData> = useCallback(
    async (state) => {
      const [assets, nextCursor, count] = await getVodAssetsByUserId(
        user.id,
        state.cursor,
        state.pageSize,
        state.order,
        formatFiltersForApiRequest(state.filters, {
          parseNumber: (n) => n * 60,
        }),
        true
      );

      const [tasks, _tasksNextCursor, _tasksCount] = await getVodTasksByUserId(
        user.id,
        state.cursor,
        state.pageSize,
        state.order,
        formatFiltersForApiRequest(state.filters, {
          parseNumber: (n) => n * 60,
        }),
        true
      );

      let assetTasks = {};

      if (tasks.length > 0) {
        for (var i = 0; i < tasks.length; i++) {
          if (tasks[i].outputAssetId) {
            assetTasks[tasks[i].outputAssetId] = tasks[i];
          }
        }
      }

      let groupedAssets = groupAssetsBySourceAsset(assets);

      return {
        nextCursor,
        count,
        rows: assets.map((asset: any) => {
          return {
            id: asset.id,
            name: {
              id: asset.id,
              children: <Box>{asset.name}</Box>,
              fallback: <i>Title</i>,
            },
            source: {
              children: (
                <Box>
                  {assetTasks[asset.id]?.params
                    ? assetTasks[asset.id]?.params?.import
                      ? assetTasks[asset.id]?.params.import.url?.indexOf(
                          "https://cdn.livepeer.com"
                        ) == 0
                        ? "Live Stream"
                        : "Import"
                      : ""
                    : ""}
                </Box>
              ),
              fallback: <i>Unknown</i>,
            },
            recordingUrl: {
              children: (
                <Box>
                  {assetTasks[asset.id]?.output?.import ? (
                    assetTasks[asset.id].output.import.videoFilePath ? (
                      <A>Download</A>
                    ) : (
                      "Failed"
                    )
                  ) : (
                    ""
                  )}
                </Box>
              ),
              fallback: <i></i>,
            },
            downloadUrl: {
              id: asset.id,
              showMP4: true,
              children: assetTasks[asset.id]?.output?.import ? (
                assetTasks[asset.id].output.import.videoFilePath ? (
                  <HoverCardRoot openDelay={200}>
                    <HoverCardTrigger>
                      <Flex css={{ ai: "center" }}>
                        <CopyToClipboard
                          text={
                            assetTasks[asset.id].output.import.videoFilePath
                          }
                          onCopy={() => openSnackbar("Copied to clipboard")}>
                          <Flex
                            css={{
                              cursor: "pointer",
                              fontSize: "$1",
                              ai: "center",
                            }}>
                            <Box css={{ mr: "$1" }}></Box>
                            <CopyIcon />
                          </Flex>
                        </CopyToClipboard>
                      </Flex>
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <Text
                        variant="gray"
                        css={{
                          borderRadius: 6,
                          px: "$3",
                          py: "$1",
                          fontSize: "$1",
                          display: "flex",
                          ai: "center",
                        }}>
                        <Box css={{ ml: "$2" }}></Box>
                      </Text>
                    </HoverCardContent>
                  </HoverCardRoot>
                ) : (
                  ""
                )
              ) : (
                <Text
                  variant="gray"
                  css={{
                    fontSize: "$1",
                    display: "flex",
                    ai: "center",
                  }}>
                  {asset.status}
                </Text>
              ),
              fallback: <i>{asset.status}</i>,
              mp4Url: assetTasks[asset.id]?.output?.import?.videoFilePath
                ? assetTasks[asset.id]?.output?.import?.videoFilePath
                : undefined,
            },
            createdAt: {
              date: new Date(asset.createdAt),
              fallback: <i>Unknown</i>,
            },
            metadata: {
              children: (
                <Box>
                  {assetTasks[asset.id]?.output?.import ? (
                    assetTasks[asset.id].output.import.metadataFilePath ? (
                      <Link
                        href={
                          assetTasks[asset.id].output.import.metadataFilePath
                        }
                        passHref>
                        <A target="_blank">Info</A>
                      </Link>
                    ) : (
                      "Failed"
                    )
                  ) : (
                    <Text
                      variant="gray"
                      css={{
                        fontSize: "$1",
                        display: "flex",
                        ai: "center",
                      }}>
                      {asset.status}
                    </Text>
                  )}
                </Box>
              ),
              fallback: <i>{asset.status}</i>,
            },
          };
        }),
      };
    },
    [getVodAssetsByUserId, getVodTasksByUserId, user.id]
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
      <Heading css={{ fontWeight: 500, mb: "$3" }}>No assets</Heading>
      <Text variant="gray" css={{ lineHeight: 1.5, mb: "$3" }}>
        Upload a new asset.
      </Text>
      <Link href="/docs/api-reference/asset/overview" passHref>
        <A variant="violet" css={{ display: "flex", ai: "center", mb: "$5" }}>
          <Box>Learn more</Box>
          <ArrowRightIcon />
        </A>
      </Link>
    </Flex>
  );

  return (
    <>
      <Table
        {...tableProps}
        columns={columns}
        fetcher={fetcher}
        initialSortBy={[{ id: "createdAt", desc: true }]}
        showOverflow={true}
        filterItems={filterItems}
        rowSelection="all"
        emptyState={emptyState}
        header={
          <>
            <Heading size="2" css={{ fontWeight: 600 }}>
              {title}
            </Heading>
          </>
        }
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
          css: { display: "flex", alignItems: "center" },
          children: (
            <>
              <PlusIcon />{" "}
              <Box as="span" css={{ ml: "$2" }}>
                Import video
              </Box>
            </>
          ),
        }}
      />
      <ImportVideoDialog
        isOpen={createDialogState.on}
        onOpenChange={createDialogState.onToggle}
        onCreate={async (videoName, videoUrl) => {
          const newTask = await importVideo({
            name: videoName,
            url: videoUrl,
          });
          await state.invalidate();
          const query = router.query.admin === "true" ? { admin: true } : {};
          await router.push({
            pathname: `/dashboard/assets/${newTask.id}`,
            query,
          });
        }}
      />
    </>
  );
};

export default assetsTable;
