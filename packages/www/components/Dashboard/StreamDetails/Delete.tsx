import {
  Box,
  Button,
  Flex,
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  Heading,
  Text,
  DropdownMenuItem,
} from "@livepeer.com/design-system";
import { useState } from "react";
import { useApi } from "../../../hooks";
import Spinner from "components/Dashboard/Spinner";
import Router from "next/router";

const Delete = ({ stream, invalidate, ...props }) => {
  const { deleteStream } = useApi();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={() => setOpen(!open)} {...props}>
      <Box
        as={DropdownMenuItem}
        onSelect={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        color="red">
        Delete
      </Box>

      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle as={Heading} size="1">
          Delete stream?
        </AlertDialogTitle>
        <AlertDialogDescription
          as={Text}
          size="2"
          variant="gray"
          css={{ mt: "$2", lineHeight: "17px" }}>
          Are you sure you want to delete stream {stream.name}? Deleting a
          stream cannot be undone.
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
                await deleteStream(stream.id);
                Router.replace("/dashboard");
                await invalidate();
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
