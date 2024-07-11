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
  Overlay,
  Heading,
  Text,
  DropdownMenuItem,
  Portal,
} from "@livepeer/design-system";
import { useState } from "react";
import { useApi } from "../../hooks";
import Spinner from "components/Spinner";
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
      <Portal>
        <Overlay />
        <AlertDialogContent
          css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
          <AlertDialogTitle asChild>
            <Heading size="1">Delete stream?</Heading>
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <Text
              size="3"
              variant="neutral"
              css={{ mt: "$2", lineHeight: "22px" }}>
              Are you sure you want to delete stream {stream.name}? Deleting a
              stream cannot be undone.
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
                  try {
                    e.preventDefault();
                    setSaving(true);
                    await deleteStream(stream.id);
                    Router.replace("/");
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
              </Button>
            </AlertDialogAction>
          </Flex>
        </AlertDialogContent>
      </Portal>
    </AlertDialog>
  );
};

export default Delete;
