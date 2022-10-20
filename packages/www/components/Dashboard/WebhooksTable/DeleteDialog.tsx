import {
  Text,
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  Heading,
  AlertDialogDescription,
  Flex,
  AlertDialogCancel,
  Button,
  AlertDialogAction,
  useSnackbar,
} from "@livepeer/design-system";
import { ToggleState } from "hooks/use-toggle-state";
import Spinner from "../Spinner";

const DeleteDialog = ({
  deleteDialogState,
  state,
  savingDeleteDialog,
  setSavingDeleteDialog,
  onDeleteWebhooks,
}: {
  deleteDialogState: ToggleState;
  state: {
    selectedRows: any[];
  };
  savingDeleteDialog: boolean;
  setSavingDeleteDialog(boolean): void;
  onDeleteWebhooks(): void;
}) => {
  const [openSnackbar] = useSnackbar();

  return (
    <AlertDialog
      open={deleteDialogState.on}
      onOpenChange={deleteDialogState.onOff}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle asChild>
          <Heading size="1">
            Delete{" "}
            {state.selectedRows.length > 1 ? state.selectedRows.length : ""}{" "}
            webhook
            {state.selectedRows.length > 1 && "s"}?
          </Heading>
        </AlertDialogTitle>
        <AlertDialogDescription asChild>
          <Text size="3" variant="gray" css={{ mt: "$2", lineHeight: "22px" }}>
            This will permanently remove the webhook
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
              onClick={async (e) => {
                try {
                  e.preventDefault();
                  setSavingDeleteDialog(true);
                  await onDeleteWebhooks();
                  openSnackbar(
                    `${state.selectedRows.length} webhook${
                      state.selectedRows.length > 1 ? "s" : ""
                    } deleted.`
                  );
                  setSavingDeleteDialog(false);
                  deleteDialogState.onOff();
                } catch (e) {
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
            </Button>
          </AlertDialogAction>
        </Flex>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteDialog;
