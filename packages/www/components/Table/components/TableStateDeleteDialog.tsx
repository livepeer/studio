import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  Heading,
  AlertDialogDescription,
  Flex,
  AlertDialogCancel,
  Button,
  AlertDialogAction,
  Text,
  useSnackbar,
} from "@livepeer/design-system";
import { ToggleState } from "hooks/use-toggle-state";
import { useState } from "react";
import Spinner from "../../Spinner";
import { State } from "..";

const TableStateDeleteDialog = ({
  entityName,
  state,
  dialogToggleState,
  deleteFunction,
  deleteMultipleFunction,
}: {
  entityName: { singular: string; plural: string };
  state: State<any>;
  dialogToggleState: ToggleState;
  deleteFunction(string): void;
  deleteMultipleFunction?(ids: string[]): void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [openSnackbar] = useSnackbar();

  const { singular, plural } = entityName;
  const name = state.selectedRows.length > 1 ? plural : singular;

  const onDeleteClick = async (e) => {
    try {
      e.preventDefault();
      setIsLoading(true);

      const ids = state.selectedRows.map((row) => row.original.id);

      if (ids.length > 1 && deleteMultipleFunction) {
        await deleteMultipleFunction(ids);
      } else if (ids.length > 1) {
        const promises = state.selectedRows.map(async (row) =>
          deleteFunction(row.original.id),
        );
        await Promise.all(promises);
      } else if (ids.length === 1) {
        await deleteFunction(ids[0]);
      }

      await state.invalidate();
      openSnackbar(`${state.selectedRows.length} ${name} deleted.`);
      dialogToggleState.onOff();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog
      open={dialogToggleState.on}
      onOpenChange={dialogToggleState.onOff}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle asChild>
          <Heading size="1">
            Delete {state.selectedRows.length} {name}?
          </Heading>
        </AlertDialogTitle>
        <AlertDialogDescription asChild>
          <Text
            size="3"
            variant="neutral"
            css={{ mt: "$2", lineHeight: "22px" }}>
            This will permanently remove the {name}. This action cannot be
            undone.
          </Text>
        </AlertDialogDescription>

        <Flex css={{ jc: "flex-end", gap: "$3", mt: "$5" }}>
          <AlertDialogCancel asChild>
            <Button size="2" onClick={dialogToggleState.onOff} ghost>
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              size="2"
              disabled={isLoading}
              onClick={onDeleteClick}
              variant="red">
              {isLoading && (
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
  );
};

export default TableStateDeleteDialog;
