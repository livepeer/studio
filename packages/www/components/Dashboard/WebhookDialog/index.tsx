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
} from "@livepeer.com/design-system";
import { useState, useEffect } from "react";
import Spinner from "components/Dashboard/Spinner";
import { Webhook } from "@livepeer.com/api";
import { Cross1Icon } from "@radix-ui/react-icons";
import urlBuilder from "@sanity/image-url";
import uuid from "uuid/v4";

const StyledCrossIcon = styled(Cross1Icon, {
  cursor: "pointer",
});

const StyledContent = styled(DropdownMenuContent, {
  minWidth: 400,
  top: -15,
  position: "relative",
  borderLeft: "1px solid $colors$slate7",
  borderRight: "1px solid $colors$slate7",
  borderBottom: "1px solid $colors$slate7",
  backgroundColor: "$loContrast",
  borderBottomLeftRadius: 6,
  borderBottomRightRadius: 6,
  borderTopRightRadius: 0,
  borderTopLeftRadius: 0,
  boxShadow: "0 7px 14px 0 rgb(60 66 87 / 8%), 0 0 0 0 rgb(0 0 0 / 12%)",
});

const eventOptions = [
  "stream.started",
  // "stream.detection", // not yet...
  "stream.idle",
  "recording.ready",
  "recording.started",
  "recording.waiting",
  "multistream.connected",
  "multistream.error",
  "multistream.disconnected",
  "playback.user.new",
];

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

            <DropdownMenu
              css={{
                width: "100%",
                top: 50,
              }}>
              <DropdownMenuTrigger as={Box}>
                <Select disabled css={{ fontSize: "$3", p: "$1" }}>
                  <Box as="option" value="" disabled selected>
                    Select events...
                  </Box>
                </Select>
              </DropdownMenuTrigger>
              <Box css={{ position: "relative" }}>
                <StyledContent
                  disableOutsidePointerEvents={false}
                  css={{ transform: "none" }}
                  portalled={false}>
                  <DropdownMenuGroup>
                    {eventOptions.map((event, i) => (
                      <DropdownMenuCheckboxItem
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
                </StyledContent>
              </Box>
            </DropdownMenu>

            <Flex
              align="center"
              direction="column"
              justify={events.length > 0 ? "start" : "center"}
              css={{
                width: "100%",
                borderRadius: 6,
                height: 200,
                overflowX: "hidden",
                overflowY: "auto",
                border: "1px solid $colors$mauve7",
                backgroundColor: "$mauve2",
                mt: "-3px",
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
                      borderBottom: "1px solid $colors$mauve5",
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
                  <Text variant="gray">
                    Search for events with the dropdown above.
                  </Text>
                </Flex>
              )}
            </Flex>
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
