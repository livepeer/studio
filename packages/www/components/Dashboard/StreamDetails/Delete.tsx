import {
  Box,
  Button,
  Flex,
  Dialog,
  DialogContent,
  Text,
  DropdownMenuItem,
} from "@livepeer.com/design-system";
import { useState } from "react";
import { useApi } from "../../../hooks";
import Spinner from "@components/Dashboard/Spinner";
import Router from "next/router";

const Delete = ({ stream, setStream, ...props }) => {
  const { deleteStream } = useApi();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} {...props}>
      <Box
        as={DropdownMenuItem}
        onSelect={(e) => {
          e.preventDefault();
        }}
        color="red"
        onClick={() => {
          setOpen(true);
        }}>
        <Box>Delete</Box>
      </Box>

      <DialogContent css={{ p: 0 }}>
        <Box
          css={{
            maxWidth: 450,
            px: "$5",
            pt: "$5",
            pb: "$4",
          }}>
          <Text
            size="4"
            css={{
              fontWeight: 500,
              lineHeight: "20px",
              mb: "$3",
            }}>
            Are you you want to delete this stream?
          </Text>
          <Text size="2" variant="gray" css={{ lineHeight: "17px" }}>
            Are you sure you want to delete stream {stream.name}? Deleting a
            stream cannot be undone.`
          </Text>
          <Flex
            css={{
              mt: "$4",
              ai: "center",
              jc: "flex-end",
            }}>
            <Button
              disabled={saving}
              onClick={() => {
                setOpen(false);
              }}
              size="2"
              css={{ mr: "$2" }}>
              Cancel
            </Button>
            <Button
              css={{ display: "flex", ai: "center" }}
              size="2"
              disabled={saving}
              onClick={async () => {
                try {
                  setSaving(true);
                  await deleteStream(stream.id);
                  Router.replace("/dashboard");
                  setStream({ ...stream });
                  setSaving(false);
                  setOpen(false);
                } catch (e) {
                  setSaving(false);
                }
              }}
              variant="violet">
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
          </Flex>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default Delete;
