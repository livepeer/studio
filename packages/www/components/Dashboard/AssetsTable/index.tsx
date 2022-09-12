import { useCallback, useMemo } from "react";
import { get } from "lodash";
import Link from "next/link";
import { ArrowRightIcon, PlusIcon } from "@radix-ui/react-icons";
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
  useSnackbar,
} from "@livepeer/design-system";
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
  source: TextCellProps;
  createdAt: DateCellProps;
  updatedAt: DateCellProps;
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
    ],
    []
  );

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

        return {
          id: asset.id,
          name: {
            id: asset.id,
            value: asset.name,
            children:
              asset.name.length > 24
                ? asset.name.replace(
                    asset.name.slice(18, asset.name.length - 6),
                    "..."
                  )
                : asset.name,
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
            date: new Date(asset.createdAt),
            fallback: <Box css={{ color: "$primary8" }}>—</Box>,
            href: `/dashboard/assets/${asset.id}`,
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
        };
      });
      return { rows, nextCursor, count };
    },
    [userId]
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
      <Flex
        direction="column"
        justify="center"
        css={{
          margin: "0 auto",
          height: "calc(100vh - 400px)",
          maxWidth: 450,
        }}>
        <Heading css={{ fontWeight: 500, mb: "$3" }}>
          Upload your first On Demand asset
        </Heading>
        <Text variant="gray" css={{ lineHeight: 1.5, mb: "$3" }}>
          Livepeer Studio supports video on demand which allows you to import
          video assets, store them on decentralized storage, and easily mint a
          video NFT.
        </Text>

        <Box
          css={{
            display: "block",
            "@bp1": {
              display: "flex",
            },
          }}>
          <Link
            href="https://docs.livepeer.studio/category/on-demand "
            passHref>
            <A
              target="_blank"
              variant="primary"
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
          variant="primary">
          <PlusIcon />{" "}
          <Box as="span" css={{ ml: "$2" }}>
            Upload asset
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
        fetcherOptions={{ refetchInterval: 15000 }}
        state={state}
        stateSetter={stateSetter}
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
