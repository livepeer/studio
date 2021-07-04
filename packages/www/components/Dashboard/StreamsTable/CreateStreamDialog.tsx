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
import { useState } from "react";
import Spinner from "@components/Dashboard/Spinner";

const CreateStreamDialog = ({
  isOpen,
  onOpenChange,
  onCreate,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: (streamName: string) => Promise<void>;
}) => {
  const [creating, setCreating] = useState(false);
  const [streamName, setStreamName] = useState("");

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
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
              await onCreate(streamName);
            } catch (error) {
              console.error(error);
            } finally {
              setCreating(false);
            }
          }}>
          <Flex direction="column" gap="2">
            <Label htmlFor="firstName">Stream name</Label>
            <TextField
              size="2"
              type="text"
              id="firstName"
              autoFocus={true}
              value={streamName}
              onChange={(e) => setStreamName(e.target.value)}
              placeholder="e.g. My First Live Stream"
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
            Newly created streams are assigned a special key and RTMP ingest URL
            to stream into.
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
              Create stream
            </Button>
          </Flex>
        </Box>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateStreamDialog;
