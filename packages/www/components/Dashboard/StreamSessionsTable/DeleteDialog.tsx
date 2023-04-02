import {
  Button,
  Flex,
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  useSnackbar,
  Heading,
  Text,
  Box,
} from "@livepeer/design-system";
import { useState } from "react";
import Spinner from "components/Dashboard/Spinner";
import { Cross1Icon } from "@radix-ui/react-icons";

const DeleteDialog = ({ total, onUnselect, onDelete }) => {
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [openSnackbar] = useSnackbar();

  return (
    <AlertDialog open={open}>
      <Flex css={{ ai: "center" }}>
        <Flex css={{ ai: "center", mr: "$3" }}>
          <Box css={{ fontSize: "$2", color: "$primary9" }}>
            {total} selected
          </Box>
          <Box css={{ height: 18, width: "1px", bc: "$primary7", mx: "$3" }} />
          <Box
            css={{ cursor: "pointer", fontSize: "$2", color: "$green11" }}
            onClick={onUnselect}>
            Deselect
          </Box>
        </Flex>
        <Button
          size="2"
          onClick={() => {
            setOpen(true);
          }}
          css={{ display: "flex", alignItems: "center" }}>
          <Cross1Icon /> <Box css={{ ml: "$2" }}>Delete</Box>
        </Button>
      </Flex>

      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle asChild>
          <Heading size="1">
            Delete {total} session{total > 1 && "s"}?
          </Heading>
        </AlertDialogTitle>
        <AlertDialogDescription asChild>
          <Text size="3" variant="gray" css={{ mt: "$2", lineHeight: "22px" }}>
            This will permanently remove the session{total > 1 && "s"}. This
            action cannot be undone.
          </Text>
        </AlertDialogDescription>

        <Flex css={{ jc: "flex-end", gap: "$3", mt: "$5" }}>
          <AlertDialogCancel asChild>
            <Button size="2" onClick={() => setOpen(false)} ghost>
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              size="2"
              disabled={saving}
              onClick={async (e) => {
                e.preventDefault();
                try {
                  setSaving(true);
                  await onDelete();
                  openSnackbar(
                    `${total} session${total > 1 ? "s" : ""} deleted.`
                  );
                  setSaving(false);
                  setOpen(false);
                } catch (e) {
                  setSaving(false);
                }
              }}
              variant="red">
              {saving && (
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
