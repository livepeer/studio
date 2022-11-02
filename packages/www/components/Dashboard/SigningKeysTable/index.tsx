import { Heading, Box } from "@livepeer/design-system";
import { useCallback, useMemo } from "react";
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
import DeleteKeysDialog from "./DeleteKeysDialog";

const SigningKeysTable = ({
  title = "Signing Keys",
  pageSize = 20,
  tableId,
}: {
  title?: string;
  pageSize?: number;
  tableId: string;
}) => {
  const { getSigningKeys } = useApi();
  const { state, stateSetter } = useTableState<SigningKeysTableData>({
    pageSize,
    tableId,
  });
  const deleteDialogState = useToggleState();
  const createDialogState = useToggleState();

  const columns = useMemo(makeColumns, []);

  const fetcher: Fetcher<SigningKeysTableData> = useCallback(
    async (state) => rowsPageFromState(state, getSigningKeys),
    []
  );

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
      <DeleteKeysDialog state={state} deleteDialogState={deleteDialogState} />

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
