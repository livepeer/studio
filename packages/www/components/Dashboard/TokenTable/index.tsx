import {
  styled,
  Heading,
  Button,
  Box,
  Flex,
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  Link as A,
  useSnackbar,
  Text,
} from "@livepeer.com/design-system";
import { useCallback, useMemo, useState } from "react";
import { useApi } from "../../../hooks";
import Table, { Fetcher, useTableState } from "components/Dashboard/Table";
import { CopyToClipboard } from "react-copy-to-clipboard";
import TextCell, { TextCellProps } from "components/Dashboard/Table/cells/text";
import { Column, Row } from "react-table";
import DateCell, { DateCellProps } from "components/Dashboard/Table/cells/date";
import { dateSort, stringSort } from "components/Dashboard/Table/sorts";
import { SortTypeArgs } from "components/Dashboard/Table/types";
import { CopyIcon } from "@radix-ui/react-icons";
import CreateTokenDialog from "./CreateTokenDialog";
import { Cross1Icon, PlusIcon } from "@radix-ui/react-icons";
import Spinner from "@components/Dashboard/Spinner";
import { useToggleState } from "hooks/use-toggle-state";
import Link from "next/link";

type TokenTableData = {
  id: string;
  name: TextCellProps;
  token: TextCellProps;
  lastUsed: DateCellProps;
  createdAt: DateCellProps;
};

const Copy = styled(CopyIcon, {
  width: 14,
  height: 14,
  color: "$hiContrast",
});

const TokenTable = ({
  title = "API Keys",
  userId,
}: {
  title?: string;
  userId: string;
}) => {
  const { getApiTokens, deleteApiToken } = useApi();
  const tableProps = useTableState({ pageSize: 30 });
  const deleteDialogState = useToggleState();
  const createDialogState = useToggleState();
  const [savingDeleteDialog, setSavingDeleteDialog] = useState(false);
  const [openSnackbar] = useSnackbar();

  const columns: Column<TokenTableData>[] = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name",
        Cell: TextCell,
        sortType: (...params: SortTypeArgs) =>
          stringSort("original.name.children", ...params),
      },
      {
        Header: "Token",
        accessor: "token",
        width: 400,
        disableSortBy: true,
        Cell: TextCell,
      },
      {
        Header: "Last Used",
        accessor: "lastUsed",
        Cell: DateCell,
        sortType: (...params: SortTypeArgs) =>
          dateSort("original.lastUsed.date", ...params),
      },
      {
        Header: "Created",
        accessor: "createdAt",
        Cell: DateCell,
        sortType: (...params: SortTypeArgs) =>
          stringSort("original.createdAt.date", ...params),
      },
    ],
    []
  );

  const Key = ({ token }) => {
    const [isCopied, setCopied] = useState(0);
    const [keyRevealed, setKeyRevealed] = useState(false);

    return (
      <Box css={{ minWidth: 300 }}>
        {keyRevealed ? (
          <Flex css={{ height: 25, ai: "center" }}>
            {token.id}
            <CopyToClipboard text={token.id} onCopy={() => setCopied(2000)}>
              <Flex
                css={{
                  alignItems: "center",
                  cursor: "pointer",
                  ml: "$1",
                }}>
                <Copy />
                {!!isCopied && (
                  <Box
                    css={{
                      ml: "$2",
                      fontSize: "$2",
                      color: "$hiContrast",
                    }}>
                    Copied
                  </Box>
                )}
              </Flex>
            </CopyToClipboard>
          </Flex>
        ) : (
          <Button size="1" type="button" onClick={() => setKeyRevealed(true)}>
            Reveal key
          </Button>
        )}
      </Box>
    );
  };

  const fetcher: Fetcher<TokenTableData> = useCallback(async () => {
    const [tokens, nextCursor, resp, count] = await getApiTokens(userId, {
      count: true,
    });

    if (!resp.ok || !Array.isArray(tokens)) {
      throw resp;
    }

    return {
      nextCursor,
      count,
      rows: tokens.map((token) => {
        return {
          id: token.id,
          token: {
            children: <Key token={token} />,
          },
          name: {
            children: token.name,
          },
          createdAt: {
            date: new Date(token.createdAt),
            fallback: <Box css={{ color: "$mauve8" }}>—</Box>,
          },
          lastUsed: {
            date: new Date(token.lastSeen),
            fallback: <i>unused</i>,
          },
        };
      }),
    };
  }, [userId]);

  const emptyState = (
    <Flex
      direction="column"
      justify="center"
      css={{
        margin: "0 auto",
        height: "calc(100vh - 400px)",
        maxWidth: 450,
      }}>
      <Heading css={{ fontWeight: 500, mb: "$3" }}>Create an API key</Heading>
      <Text variant="gray" css={{ lineHeight: 1.5, mb: "$3" }}>
        API keys allow you to authenticate API requests in your app
      </Text>
      <Link href="/docs/guides/api">
        <A css={{ mb: "$5", display: "block" }}>Learn more</A>
      </Link>
      <Button
        onClick={() => createDialogState.onOn()}
        css={{ alignSelf: "flex-start" }}
        size="2"
        variant="violet">
        <PlusIcon />{" "}
        <Box as="span" css={{ ml: "$2" }}>
          Create API key
        </Box>
      </Button>
    </Flex>
  );

  return (
    <>
      <Table
        {...tableProps}
        tableId="api-tokens"
        header={
          <>
            <Heading size="2" css={{ fontWeight: 600 }}>
              {title}
            </Heading>
          </>
        }
        columns={columns}
        fetcher={fetcher}
        rowSelection="all"
        emptyState={emptyState}
        selectAction={{
          onClick: deleteDialogState.onOn,
          children: (
            <>
              <Cross1Icon /> <Box css={{ ml: "$2" }}>Delete</Box>
            </>
          ),
          css: { display: "flex", alignItems: "center" },
          // @ts-ignore
          size: "2",
        }}
        createAction={{
          onClick: createDialogState.onOn,
          css: { display: "flex", alignItems: "center" },
          children: (
            <>
              <PlusIcon />{" "}
              <Box as="span" css={{ ml: "$2" }}>
                Create key
              </Box>
            </>
          ),
        }}
      />

      {/* Delete dialog */}
      <AlertDialog open={deleteDialogState.on}>
        <AlertDialogContent
          css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
          <AlertDialogTitle as={Heading} size="1">
            Delete {tableProps.state.selectedRows.length} API token
            {tableProps.state.selectedRows.length > 1 && "s"}?
          </AlertDialogTitle>
          <AlertDialogDescription
            as={Text}
            size="3"
            variant="gray"
            css={{ mt: "$2", lineHeight: "22px" }}>
            This will permanently remove the API token
            {tableProps.state.selectedRows.length > 1 && "s"}. This action
            cannot be undone.
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
                  const promises = tableProps.state.selectedRows.map(
                    async (row) => {
                      return deleteApiToken(row.original.id as string);
                    }
                  );
                  await Promise.all(promises);
                  await tableProps.state.swrState?.revalidate();
                  openSnackbar(
                    `${tableProps.state.selectedRows.length} stream${
                      tableProps.state.selectedRows.length > 1 ? "s" : ""
                    } deleted.`
                  );
                  deleteDialogState.onOff();
                } finally {
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

      {/* Create dialog */}
      <CreateTokenDialog
        isOpen={createDialogState.on}
        onClose={createDialogState.onOff}
        onOpenChange={createDialogState.onToggle}
        onCreateSuccess={tableProps.state.swrState?.revalidate}
      />
    </>
  );
};

export default TokenTable;
