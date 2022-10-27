import { Heading, Box } from "@livepeer/design-system";
import { useCallback, useMemo, useState } from "react";
import { useApi } from "../../../hooks";
import Table, { Fetcher, useTableState } from "components/Dashboard/Table";
import CreateDialog from "./CreateDialog";
import { Cross1Icon, PlusIcon } from "@radix-ui/react-icons";
import { useToggleState } from "hooks/use-toggle-state";
import { ApiKeysTableData, makeColumns, rowsPageFromState } from "./helpers";
import EmptyState from "./EmptyState";
import DeleteDialog from "./DeleteDialog";

const ApiKeysTable = ({
  title = "API Keys",
  userId,
}: {
  title?: string;
  userId: string;
}) => {
  const { getApiTokens, deleteApiToken } = useApi();
  const { state, stateSetter } = useTableState<ApiKeysTableData>({
    tableId: "tokenTable",
  });
  const deleteDialogState = useToggleState();
  const createDialogState = useToggleState();
  const [savingDeleteDialog, setSavingDeleteDialog] = useState(false);
  const columns = useMemo(makeColumns, []);

  const fetcher: Fetcher<ApiKeysTableData> = useCallback(
    async () => rowsPageFromState(userId, getApiTokens),
    [userId]
  );

  return (
    <>
      <Table
        state={state}
        stateSetter={stateSetter}
        header={
          <Heading size="2" css={{ fontWeight: 600 }}>
            {title}
          </Heading>
        }
        columns={columns}
        fetcher={fetcher}
        rowSelection="all"
        emptyState={<EmptyState createDialogState={createDialogState} />}
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

      <DeleteDialog
        state={state}
        deleteDialogState={deleteDialogState}
        savingDeleteDialog={savingDeleteDialog}
        setSavingDeleteDialog={setSavingDeleteDialog}
        deleteApiToken={deleteApiToken}
      />

      <CreateDialog
        isOpen={createDialogState.on}
        onClose={createDialogState.onOff}
        onOpenChange={createDialogState.onToggle}
        onCreateSuccess={state.invalidate}
      />
    </>
  );
};

export default ApiKeysTable;
