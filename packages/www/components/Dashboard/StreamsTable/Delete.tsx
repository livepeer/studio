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
} from "@livepeer.com/design-system";
import { useState } from "react";
import Spinner from "@components/Dashboard/Spinner";
import { Cross1Icon } from "@radix-ui/react-icons";

const Delete = ({ total, onUnselect, onDelete }) => {
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [openSnackbar] = useSnackbar();

  return (
    <AlertDialog open={open}>
      <Flex css={{ ai: "center" }}>
        <Flex css={{ ai: "center", mr: "$3" }}>
          <Box css={{ fontSize: "$2", color: "$mauve9" }}>{total} selected</Box>
          <Box css={{ height: 18, width: "1px", bc: "$mauve7", mx: "$3" }} />
          <Box
            css={{ cursor: "pointer", fontSize: "$2", color: "$violet11" }}
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
        <AlertDialogTitle as={Heading} size="1">
          Delete {total} stream{total > 1 && "s"}?
        </AlertDialogTitle>
        <AlertDialogDescription
          as={Text}
          size="3"
          variant="gray"
          css={{ mt: "$2", lineHeight: "22px" }}>
          This will permanently remove the stream{total > 1 && "s"}. This action
          cannot be undone.
        </AlertDialogDescription>

        <Flex css={{ jc: "flex-end", gap: "$3", mt: "$5" }}>
          <AlertDialogCancel
            size="2"
            onClick={() => setOpen(false)}
            as={Button}
            ghost>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            as={Button}
            size="2"
            disabled={saving}
            onClick={async () => {
              try {
                setSaving(true);
                await onDelete();
                openSnackbar(`${total} stream${total > 1 ? "s" : ""} deleted.`);
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
          </AlertDialogAction>
        </Flex>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default Delete;
