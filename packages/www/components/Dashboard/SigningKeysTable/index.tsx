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

const SigningKeysTable = ({ title = "Signing Keys" }: { title?: string }) => {
  const { getSigningKeys } = useApi();
  const tableProps = useTableState({ tableId: "signingKeysTable" });
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
        {...tableProps}
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

    </>
  );
};

export default SigningKeysTable;
