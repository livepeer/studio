import {
  Box,
  Button,
  Flex,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
  TextField,
  Text,
  Label,
  styled,
} from "@livepeer.com/design-system";
import { useState } from "react";
import { useApi } from "../../../hooks";
import { useRouter } from "next/router";
import { PlusIcon } from "@radix-ui/react-icons";
import Spinner from "@components/Dashboard/Spinner";

const StyledPlusIcon = styled(PlusIcon, {
  mr: "$1",
});

const CreateStream = () => {
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const [streamName, setStreamName] = useState("");
  const { user, createStream } = useApi();

  return (
    <Dialog>
      <DialogTrigger
        as={Button}
        variant="violet"
        size="2"
        css={{ display: "flex", alignItems: "center" }}>
        <StyledPlusIcon /> Create stream
      </DialogTrigger>
      <DialogContent css={{ p: 0 }}>
        <Box
          css={{
            p: "$4",
            fontWeight: 500,
            borderBottom: "1px solid",
            borderColor: "$slate6",
          }}>
          <Text size="4" as="h6">
            Create a new stream
          </Text>
        </Box>

        <Box
          as="form"
          onSubmit={(e) => {
            e.preventDefault();
            if (creating) {
              return;
            }
            setCreating(true);
            createStream({
              name: streamName,
              profiles: [
                {
                  name: "240p0",
                  fps: 0,
                  bitrate: 250000,
                  width: 426,
                  height: 240,
                },
                {
                  name: "360p0",
                  fps: 0,
                  bitrate: 800000,
                  width: 640,
                  height: 360,
                },
                {
                  name: "480p0",
                  fps: 0,
                  bitrate: 1600000,
                  width: 854,
                  height: 480,
                },
                {
                  name: "720p0",
                  fps: 0,
                  bitrate: 3000000,
                  width: 1280,
                  height: 720,
                },
              ],
            })
              .then((newStream) => {
                const query =
                  router.query.admin === "true" ? { admin: true } : {};
                router.push({
                  pathname: `/dashboard/streams/${newStream.id}`,
                  query,
                });
              })
              .catch((e) => {
                setCreating(false);
              });
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
              <Text size="1" css={{ fontWeight: 500, color: "$gray9" }}>
                A-Z, a-z, 0-9, -, _, ~ only
              </Text>
            </Flex>
            <Text size="2" as="p" css={{ mt: "$6", color: "$gray11" }}>
              Newly created streams are assigned a special key and RTMP ingest
              URL to stream into.
            </Text>
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
                Create stream
              </Button>
            </Flex>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStream;
