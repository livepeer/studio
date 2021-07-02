import { useCallback, useMemo } from "react";
import { useApi } from "../../../hooks";
import Table, { Fetcher, useTableState } from "components/Dashboard/Table";
import TextCell, { TextCellProps } from "components/Dashboard/Table/cells/text";
import DateCell, { DateCellProps } from "components/Dashboard/Table/cells/date";
import {
  dateSort,
  numberSort,
  stringSort,
} from "components/Dashboard/Table/sorts";
import { SortTypeArgs } from "components/Dashboard/Table/types";
import { Column } from "react-table";
import {
  Box,
  Flex,
  Heading,
  Link as A,
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  Button,
  Text,
  useSnackbar,
} from "@livepeer.com/design-system";
import { useToggleState } from "hooks/use-toggle-state";
import { Cross1Icon, PlusIcon } from "@radix-ui/react-icons";
import Spinner from "components/Dashboard/Spinner";
import WebhookDialog, { Action } from "components/Dashboard/WebhookDialog";
import { useRouter } from "next/router";
import { Webhook } from "@livepeer.com/api";
import Link from "next/link";

type WebhooksTableData = {
  name: TextCellProps;
  url: TextCellProps;
  created: DateCellProps;
};

const WebhooksTable = ({ title = "Webhooks" }: { title?: string }) => {
  const router = useRouter();
  const { user, getWebhooks, deleteWebhook, createWebhook } = useApi();
  const deleteDialogState = useToggleState();
  const savingState = useToggleState();
  const [openSnackbar] = useSnackbar();
  const createDialogState = useToggleState();
  const { state, stateSetter } = useTableState<WebhooksTableData>({
    tableId: "webhooksTable",
  });

  const columns: Column<WebhooksTableData>[] = useMemo(
    () => [
      {
        Header: "URL",
        accessor: "url",
        Cell: TextCell,
        sortType: (...params: SortTypeArgs) =>
          numberSort("original.url.children", ...params),
      },
      {
        Header: "Name",
        accessor: "name",
        Cell: TextCell,
        sortType: (...params: SortTypeArgs) =>
          stringSort("original.name.children", ...params),
      },
      {
        Header: "Created at",
        accessor: "created",
        Cell: DateCell,
        sortType: (...params: SortTypeArgs) =>
          dateSort("original.created.date", ...params),
      },
    ],
    []
  );

  const fetcher: Fetcher<WebhooksTableData> = useCallback(
    async (state) => {
      const [webhooks, nextCursor, _res, count] = await getWebhooks(
        false,
        false,
        state.order,
        null,
        state.pageSize,
        state.cursor,
        true
      );

      return {
        nextCursor,
        count,
        rows: webhooks.map((webhook: Webhook) => {
          return {
            name: {
              children: webhook.name,
              href: `/dashboard/developers/webhooks/${webhook.id}`,
              css: {
                cursor: "pointer",
              },
            },
            url: {
              children: webhook.url,
              href: `/dashboard/developers/webhooks/${webhook.id}`,
              css: {
                cursor: "pointer",
              },
            },
            created: {
              date: new Date(webhook.createdAt),
              fallback: <i>unseen</i>,
              href: `/dashboard/developers/webhooks/${webhook.id}`,
              css: {
                cursor: "pointer",
              },
            },
          };
        }),
      };
    },
    [getWebhooks, user.id]
  );

  // const onDeleteStreams = useCallback(async () => {
  //   if (state.selectedRows.length === 1) {
  //     await deleteStream(state.selectedRows[0].id);
  //     await state.queryState?.invalidate();
  //     deleteDialogState.onOff();
  //   } else if (state.selectedRows.length > 1) {
  //     await deleteStreams(state.selectedRows.map((s) => s.id));
  //     await state.queryState?.invalidate();
  //     deleteDialogState.onOff();
  //   }
  // }, [
  //   deleteStream,
  //   deleteStreams,
  //   deleteDialogState.onOff,
  //   state.selectedRows.length,
  //   state.swrState?.revalidate,
  // ]);

  const emptyState = (
    <Flex
      direction="column"
      justify="center"
      css={{
        margin: "0 auto",
        height: "calc(100vh - 400px)",
        maxWidth: 450,
      }}>
      <Heading css={{ fontWeight: 500, mb: "$3" }}>
        Create your first webhook
      </Heading>
      <Text variant="gray" css={{ lineHeight: 1.5, mb: "$3" }}>
        Listen for events on your Livpeeer.com account so your integration can
        automatically trigger reactions.
      </Text>
      <Link href="/docs" passHref>
        <A variant="violet" css={{ mb: "$5", display: "block" }}>
          Learn more
        </A>
      </Link>
      <Button
        onClick={() => createDialogState.onOn()}
        css={{ alignSelf: "flex-start" }}
        size="2"
        variant="violet">
        <PlusIcon />{" "}
        <Box as="span" css={{ ml: "$2" }}>
          Create webhook
        </Box>
      </Button>
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
                Create webhook
              </Box>
            </>
          ),
        }}
      />

      <AlertDialog open={deleteDialogState.on}>
        <AlertDialogContent
          css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
          <AlertDialogTitle as={Heading} size="1">
            Delete{" "}
            {state.selectedRows.length > 1 ? state.selectedRows.length : ""}{" "}
            webhook
            {state.selectedRows.length > 1 && "s"}?
          </AlertDialogTitle>
          <AlertDialogDescription
            as={Text}
            size="3"
            variant="gray"
            css={{ mt: "$2", lineHeight: "22px" }}>
            This will permanently remove the webhook
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
              disabled={savingState.on}
              onClick={async () => {
                try {
                  savingState.onOn();
                  //await onDeleteStreams();
                  openSnackbar(
                    `${state.selectedRows.length} webhooks${
                      state.selectedRows.length > 1 ? "s" : ""
                    } deleted.`
                  );
                  savingState.onOff();
                  deleteDialogState.onOff();
                } catch (e) {
                  savingState.onOff();
                }
              }}
              variant="red">
              {savingState.on && (
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
      <WebhookDialog
        action={Action.Create}
        isOpen={createDialogState.on}
        onOpenChange={createDialogState.onToggle}
        onSubmit={async ({ event, name, url }) => {
          const newWebhook = await createWebhook({
            event,
            name,
            url,
          });
          await state.invalidate();
          const query = router.query.admin === "true" ? { admin: true } : {};
          await router.push({
            pathname: `/dashboard/developers/webhooks/${newWebhook.id}`,
            query,
          });
        }}
      />
    </>
  );
};

export default WebhooksTable;
