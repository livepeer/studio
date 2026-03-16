import {
  Box,
  Flex,
  TextField,
  Label,
  Text,
  Select,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
  Heading,
  styled,
  useSnackbar,
} from "@livepeer/design-system";
import { useState, useEffect } from "react";
import Spinner from "components/Spinner";
import { Webhook } from "@livepeer.studio/api";
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogClose,
} from "components/ui/dialog";
import { Cross1Icon } from "@radix-ui/react-icons";
import { v4 as uuid } from "uuid";
import { Button } from "components/ui/button";

const StyledCrossIcon = styled(Cross1Icon, {});

const eventOptions: Webhook["events"] = [
  "playback.accessControl",
  "stream.started",
  "stream.idle",
  "recording.ready",
  "recording.started",
  "recording.waiting",
  "multistream.connected",
  "multistream.error",
  "multistream.disconnected",
  "asset.created",
  "asset.updated",
  "asset.ready",
  "asset.failed",
  "asset.deleted",
  "task.spawned",
  "task.updated",
  "task.completed",
  "task.failed",
];

export enum Action {
  Create = "Create",
  Update = "Update",
}

const CreateEditDialog = ({
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
    events,
    name,
    url,
    sharedSecret,
  }: {
    events: string[];
    name: string;
    url: string;
    sharedSecret: string;
  }) => Promise<void>;
}) => {
  const [saving, setSaving] = useState(false);
  const [webhookName, setWebhookName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [openSnackbar] = useSnackbar();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (webhook) {
      setEvents(webhook.events);
    }
  }, [webhook]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {button}
      <DialogContent
        css={{ width: 450, maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <DialogTitle>
          <Heading size="1">
            {action === Action.Create
              ? "Add a webhook endpoint"
              : "Update webhook endpoint"}
          </Heading>
        </DialogTitle>
        <Box
          as="form"
          css={{
            "[data-radix-popper-wrapper]": {
              transform: "none !important",
              zIndex: 2,
            },
          }}
          onSubmit={async (e) => {
            e.preventDefault();
            if (saving) {
              return;
            }
            setSaving(true);
            try {
              await onSubmit({
                events,
                name: webhookName,
                url: webhookUrl,
                sharedSecret: webhookSecret,
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
              placeholder="A name to identify your webhook"
            />

            <Label htmlFor="url">URL</Label>
            <TextField
              required
              size="2"
              type="url"
              pattern="^[^ ].+[^ ]$"
              id="url"
              defaultValue={Action.Update ? webhook?.url : ""}
              placeholder="https://"
              onChange={(e) => setWebhookUrl(e.target.value)}
            />

            <Label htmlFor="sharedSecret">Secret</Label>
            <TextField
              size="2"
              type="text"
              id="sharedSecret"
              defaultValue={Action.Update ? webhook?.sharedSecret : uuid()}
              placeholder="secret used to sign the webhook requests"
              onChange={(e) => setWebhookSecret(e.target.value)}
            />
            <Label htmlFor="events">Event types</Label>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Box>
                  <Select css={{ fontSize: "$3", px: "$2", mb: "$4" }}>
                    <Box as="option" value="" disabled selected>
                      Select events...
                    </Box>
                  </Select>
                </Box>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="z-50"
                placeholder="dropdown-menu-content"
                css={{ mt: "$1" }}>
                <Box
                  css={{
                    position: "relative",
                    minWidth: 450,
                    top: -10,
                    borderLeft: "1px solid $colors$neutral7",
                    borderRight: "1px solid $colors$neutral7",
                    borderBottom: "1px solid $colors$neutral7",
                    backgroundColor: "$loContrast",
                    borderBottomLeftRadius: 6,
                    borderBottomRightRadius: 6,
                    borderTopRightRadius: 0,
                    borderTopLeftRadius: 0,
                    boxShadow:
                      "0 7px 14px 0 rgb(60 66 87 / 8%), 0 0 0 0 rgb(0 0 0 / 12%)",
                  }}>
                  <DropdownMenuGroup>
                    {eventOptions.map((event, i) => (
                      <DropdownMenuCheckboxItem
                        placeholder="dropdown-menu-checkbox-item"
                        key={i}
                        checked={events.includes(event)}
                        onSelect={(e) => {
                          e.preventDefault();
                          if (events.includes(event)) {
                            setEvents(events.filter((item) => item !== event));
                          } else {
                            setEvents([...events, event]);
                          }
                          return;
                        }}>
                        {event}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuGroup>
                </Box>
              </DropdownMenuContent>
            </DropdownMenu>

            <Flex
              align="center"
              direction="column"
              justify={events.length > 0 ? "start" : "center"}
              css={{
                width: "100%",
                borderRadius: 6,
                height: 200,
                mt: "$1",
                overflowX: "hidden",
                overflowY: "auto",
                border: "1px solid $colors$neutral7",
                backgroundColor: "$neutral2",
                zIndex: 1,
              }}>
              {events.length > 0 ? (
                events.map((event, i) => (
                  <Flex
                    key={i}
                    justify="between"
                    align="center"
                    css={{
                      width: "100%",
                      borderBottom: "1px solid $colors$neutral5",
                      p: "$2",
                      fontSize: "$2",
                      color: "$hiContrast",
                    }}>
                    {event}
                    <StyledCrossIcon
                      onClick={() => {
                        setEvents(events.filter((e) => e !== event));
                      }}
                    />
                  </Flex>
                ))
              ) : (
                <Flex
                  direction="column"
                  css={{ just: "center" }}
                  align="center">
                  <Text css={{ fontWeight: 600 }}>No events selected</Text>
                  <Text variant="neutral">
                    Search for events with the dropdown above.
                  </Text>
                </Flex>
              )}
            </Flex>
          </Flex>
          <Box>
            <Flex className="gap-2 items-center justify-end">
              <DialogClose asChild>
                <Button disabled={saving} variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={saving}>
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
                {action} webhook
              </Button>
            </Flex>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditDialog;
