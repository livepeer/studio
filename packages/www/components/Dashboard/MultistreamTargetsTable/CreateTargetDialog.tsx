import { useState } from "react";

import {
  Box,
  Button,
  Flex,
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogCancel,
  AlertDialogDescription,
  TextField,
  Heading,
  Text,
  Label,
} from "@livepeer.com/design-system";

import Spinner from "components/Dashboard/Spinner";
import { useApi } from "hooks";

import { Stream, StreamPatchPayload } from "../../../../api/src/schema/types";

type CreateTargetSpec = StreamPatchPayload["multistream"]["targets"][number];

const CreateTargetDialog = ({
  isOpen,
  setOpen,
  stream,
  invalidateStream,
}: {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  stream: Stream;
  invalidateStream: () => Promise<void>;
}) => {
  const { patchStream } = useApi();
  const [creating, setCreating] = useState(false);
  const [targetUrl, setTargetUrl] = useState("");

  return (
    <AlertDialog open={isOpen} onOpenChange={setOpen}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle as={Heading} size="1">
          Create a new stream
        </AlertDialogTitle>

        <Box
          css={{ mt: "$3" }}
          as="form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (creating) {
              return;
            }
            setCreating(true);
            try {
              const targets: CreateTargetSpec[] = [
                ...(stream.multistream?.targets ?? []),
                { profile: "source", spec: { url: targetUrl } },
              ];
              await patchStream(stream.id, { multistream: { targets } });
              await invalidateStream();
              setOpen(false);
            } catch (error) {
              console.error(error);
            } finally {
              setCreating(false);
            }
          }}>
          <Flex direction="column" gap="2">
            <Label htmlFor="targetUrl">Multistream target URL</Label>
            <TextField
              required
              size="2"
              type="url"
              id="targetUrl"
              autoFocus={true}
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="e.g. rtmp://streaming.tv/live/"
            />
            {/* <Text size="1" css={{ fontWeight: 500, color: "$gray9" }}>
              A-Z, a-z, 0-9, -, _, ~ only
            </Text> */}
          </Flex>
          <AlertDialogDescription
            as={Text}
            size="3"
            variant="gray"
            css={{ mt: "$2", fontSize: "$2", mb: "$4" }}>
            Future stream sessions will be multistreamed to this target URL. In
            progress stream sessions need to be restarted to get the update.
          </AlertDialogDescription>

          <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
            <AlertDialogCancel disabled={creating} size="2" as={Button} ghost>
              Cancel
            </AlertDialogCancel>
            <Button
              css={{ display: "flex", ai: "center" }}
              type="submit"
              size="2"
              disabled={creating}
              variant="violet">
              {creating && (
                <Spinner
                  css={{
                    color: "$hiContrast",
                    width: 16,
                    height: 16,
                    mr: "$2",
                  }}
                />
              )}
              Create target
            </Button>
          </Flex>
        </Box>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateTargetDialog;
