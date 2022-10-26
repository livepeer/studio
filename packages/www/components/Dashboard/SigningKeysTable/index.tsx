import {
  Text,
  Heading,
  Box,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  Button,
  Flex,
  useSnackbar,
} from "@livepeer/design-system";
import { useCallback, useMemo, useState } from "react";
import { useApi } from "../../../hooks";
import Table, { Fetcher, useTableState } from "components/Dashboard/Table";
import { Cross1Icon, PlusIcon } from "@radix-ui/react-icons";
import { useToggleState } from "hooks/use-toggle-state";
import EmptyState from "./EmptyState";
import {
  makeColumns,
  rowsPageFromState,
  SigningKeysTableData,
} from "./helpers";
import CreateKeyDialog from "./CreateKeyDialog";
import Spinner from "../Spinner";

const SigningKeysTable = ({
  title = "Signing Keys",
  pageSize = 20,
  tableId,
}: {
  title?: string;
  pageSize?: number;
  tableId: string;
}) => {
  const { getSigningKeys, deleteSigningKey } = useApi();
  const { state, stateSetter } = useTableState<SigningKeysTableData>({
    pageSize,
    tableId,
  });
  const deleteDialogState = useToggleState();
  const createDialogState = useToggleState();
  const [openSnackbar] = useSnackbar();
  const [savingDeleteDialog, setSavingDeleteDialog] = useState(false);

  const columns = useMemo(makeColumns, []);

  const fetcher: Fetcher<SigningKeysTableData> = useCallback(
    async (state) => rowsPageFromState(state, getSigningKeys),
    []
  );

  const onDeleteSigningKeys = useCallback(async () => {
    setSavingDeleteDialog(true);
    await Promise.all(
      state.selectedRows.map((row) => deleteSigningKey(row.id))
    );
    openSnackbar(
      `${state.selectedRows.length} signing key${
        state.selectedRows.length > 1 ? "s" : ""
      } deleted.`
    );
    setSavingDeleteDialog(false);
    await state.invalidate();
    deleteDialogState.onOff();
  }, [
    deleteSigningKey,
    deleteDialogState.onOff,
    state.selectedRows.length,
    state.invalidate,
  ]);

  return (
    <>
      <Table
        columns={columns}
        fetcher={fetcher}
        rowSelection="all"
        state={state}
        stateSetter={stateSetter}
        emptyState={<EmptyState createDialogState={createDialogState} />}
        header={
          <Heading size="2" css={{ fontWeight: 600 }}>
            {title}
          </Heading>
        }
        initialSortBy={[{ id: "createdAt", desc: true }]}
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
      />

      {/* Delete dialog */}
      <AlertDialog
        open={deleteDialogState.on}
        onOpenChange={deleteDialogState.onOff}>
        <AlertDialogContent
          css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
          <AlertDialogTitle asChild>
            <Heading size="1">
              Delete {state.selectedRows.length} signing key
              {state.selectedRows.length > 1 && "s"}?
            </Heading>
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <Text
              size="3"
              variant="gray"
              css={{ mt: "$2", lineHeight: "22px" }}>
              This will permanently remove the signing key
              {state.selectedRows.length > 1 && "s"}. This action cannot be
              undone.
            </Text>
          </AlertDialogDescription>

          <Flex css={{ jc: "flex-end", gap: "$3", mt: "$5" }}>
            <AlertDialogCancel asChild>
              <Button size="2" onClick={deleteDialogState.onOff} ghost>
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                size="2"
                disabled={savingDeleteDialog}
                onClick={onDeleteSigningKeys}
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
              </Button>
            </AlertDialogAction>
          </Flex>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create dialog */}
      <CreateKeyDialog
        isOpen={createDialogState.on}
        onClose={createDialogState.onOff}
        onOpenChange={createDialogState.onToggle}
        onCreateSuccess={state.invalidate}
      />
    </>
  );
};

export default SigningKeysTable;
