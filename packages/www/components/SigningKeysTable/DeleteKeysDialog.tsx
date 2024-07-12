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
import { useApi } from "hooks";
import { ToggleState } from "hooks/use-toggle-state";
import { useCallback, useState } from "react";
import Spinner from "../Spinner";
import { State } from "../Table";
import { SigningKeysTableData } from "./helpers";

const DeleteKeysDialog = ({
  state,
  deleteDialogState,
}: {
  state: State<SigningKeysTableData>;
  deleteDialogState: ToggleState;
}) => {
  const { deleteSigningKey } = useApi();
  const [openSnackbar] = useSnackbar();
  const [isDeleting, setIsDeleting] = useState(false);

  const onDeleteSigningKeys = useCallback(async () => {
    setIsDeleting(true);
    await Promise.all(
      state.selectedRows.map((row) => deleteSigningKey(row.id)),
    );
    openSnackbar(
      `${state.selectedRows.length} signing key${
        state.selectedRows.length > 1 ? "s" : ""
      } deleted.`,
    );
    setIsDeleting(false);
    await state.invalidate();
    deleteDialogState.onOff();
  }, [
    deleteSigningKey,
    deleteDialogState.onOff,
    state.selectedRows.length,
    state.invalidate,
  ]);

  return (
    <AlertDialog
      open={deleteDialogState.on}
      onOpenChange={deleteDialogState.onOff}>
      <AlertDialogContent className="bg-surface" css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle asChild>
          <Heading size="1">
            Delete {state.selectedRows.length} signing key
            {state.selectedRows.length > 1 && "s"}?
          </Heading>
        </AlertDialogTitle>
        <AlertDialogDescription asChild>
          <Text
            size="3"
            variant="neutral"
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
              disabled={isDeleting}
              onClick={onDeleteSigningKeys}
              variant="red">
              {isDeleting && (
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

export default DeleteKeysDialog;
