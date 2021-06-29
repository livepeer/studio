import {
  Box,
  Button,
  Flex,
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogCancel,
  TextField,
  Label,
  Select,
  Heading,
  useSnackbar,
} from "@livepeer.com/design-system";
import { useState } from "react";
import Spinner from "@components/Dashboard/Spinner";
import { Webhook } from "@livepeer.com/api";

export enum Action {
  Create = "Create",
  Update = "Update",
}

const WebhookDialog = ({
  isOpen,
  onOpenChange,
  onSubmit,
  action,
  button,
  webhook,
}: {
  isOpen: boolean;
  button?: any;
  action: Action;
  webhook?: Webhook;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: ({
    event,
    name,
    url,
  }: {
    event: string;
    name: string;
    url: string;
  }) => Promise<void>;
}) => {
  const [saving, setSaving] = useState(false);
  const [webhookName, setWebhookName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [openSnackbar] = useSnackbar();

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      {button}
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle as={Heading} size="1">
          {action === Action.Create
            ? "Add a webhook endpoint"
            : "Update webhook endpoint"}
        </AlertDialogTitle>

        <Box
          as="form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (saving) {
              return;
            }
            setSaving(true);
            try {
              await onSubmit({
                event: "stream.started",
                name: webhookName,
                url: webhookUrl,
              });
              openSnackbar(`Webhook updated.`);
              onOpenChange(false);
            } catch (error) {
              console.error(error);
            } finally {
              setSaving(false);
            }
          }}>
          <Flex css={{ my: "$3" }} direction="column" gap="2">
            <Label htmlFor="name">Name</Label>
            <TextField
              required
              size="2"
              type="text"
              id="name"
              autoFocus={true}
              defaultValue={Action.Update ? webhook?.name : ""}
              onChange={(e) => setWebhookName(e.target.value)}
              placeholder="My Webhook"
            />

            <Label htmlFor="url">URL</Label>
            <TextField
              required
              size="2"
              type="url"
              id="url"
              defaultValue={Action.Update ? webhook?.url : ""}
              placeholder="https://"
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <Label htmlFor="events">Event types</Label>
            <Select css={{ p: "$1" }} id="events" name="events">
              <Box as="option">stream.started</Box>
              <Box as="option">stream.ended</Box>
            </Select>
          </Flex>
          <Box>
            <Flex css={{ ai: "center", jc: "flex-end" }}>
              <AlertDialogCancel
                disabled={saving}
                as={Button}
                size="2"
                css={{ mr: "$2" }}>
                Cancel
              </AlertDialogCancel>
              <Button
                css={{ display: "flex", ai: "center" }}
                type="submit"
                size="2"
                disabled={saving}
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
                {action} endpoint
              </Button>
            </Flex>
          </Box>
        </Box>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default WebhookDialog;
