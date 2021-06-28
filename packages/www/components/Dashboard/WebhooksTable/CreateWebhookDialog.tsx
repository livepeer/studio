import {
  Box,
  Button,
  Flex,
  Dialog,
  DialogContent,
  DialogClose,
  TextField,
  Text,
  Label,
  styled,
} from "@livepeer.com/design-system";
import { useState } from "react";
import Spinner from "@components/Dashboard/Spinner";

const CreateWebhookDialog = ({
  isOpen,
  onOpenChange,
  onCreate,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: ({
    event,
    name,
    url,
  }: {
    event: string;
    name: string;
    url: string;
  }) => Promise<void>;
}) => {
  const [creating, setCreating] = useState(false);
  const [webhookName, setWebhookName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  console.log(webhookName, webhookUrl);
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent css={{ p: 0 }}>
        <Box
          css={{
            p: "$4",
            fontWeight: 500,
            borderBottom: "1px solid",
            borderColor: "$slate6",
          }}>
          <Text size="4" as="h6">
            Create a new webhook
          </Text>
        </Box>

        <Box
          as="form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (creating) {
              return;
            }
            setCreating(true);
            try {
              await onCreate({
                event: "stream.started",
                name: webhookName,
                url: webhookUrl,
              });
            } catch (error) {
              console.error(error);
            } finally {
              setCreating(false);
            }
          }}>
          <Box
            css={{
              px: "$4",
              pt: "$5",
              pb: "$5",
              borderBottom: "1px solid",
              borderColor: "$slate6",
            }}>
            <Flex direction="column" gap="2">
              <Label htmlFor="name">Name</Label>
              <TextField
                required
                size="2"
                type="text"
                id="name"
                autoFocus={true}
                value={webhookName}
                onChange={(e) => setWebhookName(e.target.value)}
                placeholder="My Webhook"
              />
              <Text size="1" css={{ fontWeight: 500, color: "$gray9" }}>
                A-Z, a-z, 0-9, -, _, ~ only
              </Text>
              <Label htmlFor="url">URL</Label>
              <TextField
                required
                size="2"
                type="url"
                id="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </Flex>
          </Box>
          <Box css={{ py: "$3", px: "$4" }}>
            <Flex css={{ ai: "center", jc: "flex-end" }}>
              <DialogClose
                disabled={creating}
                as={Button}
                size="2"
                css={{ mr: "$2" }}>
                Cancel
              </DialogClose>
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
                Create
              </Button>
            </Flex>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWebhookDialog;
