import { Box, Flex, Heading, Label, TextField } from "@livepeer/design-system";
import Spinner from "components/Spinner";
import { Button } from "components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "components/ui/dialog";
import { Input } from "components/ui/input";
import { Text } from "components/ui/text";
import { useState } from "react";

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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <DialogTitle asChild>
          <Heading size="1">Create a new livestream</Heading>
        </DialogTitle>
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
            <Input
              required
              type="text"
              id="firstName"
              autoFocus={true}
              value={streamName}
              onChange={(e) => setStreamName(e.target.value)}
              placeholder="e.g. My first livestream"
            />
            {/* <Text size="1" css={{ fontWeight: 500, color: "$gray9" }}>
              A-Z, a-z, 0-9, -, _, ~ only
            </Text> */}
          </Flex>
          <DialogDescription asChild>
            <Text className="mt-2" variant="neutral">
              Newly created streams are assigned a special key and RTMP ingest
              URL to stream into.
            </Text>
          </DialogDescription>

          <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
            <DialogClose asChild>
              <Button disabled={creating} variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              css={{ display: "flex", ai: "center" }}
              type="submit"
              disabled={creating}>
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
              Create livestream
            </Button>
          </Flex>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStreamDialog;
