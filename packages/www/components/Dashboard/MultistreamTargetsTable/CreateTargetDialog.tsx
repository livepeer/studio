import { useMemo, useState } from "react";
import url from "url";

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
  useSnackbar,
  RadioGroup,
  Radio,
  Tooltip,
} from "@livepeer.com/design-system";

import Spinner from "components/Dashboard/Spinner";
import { useApi } from "hooks";
import { Stream, StreamPatchPayload } from "../../../../api/src/schema/types";
import { pathJoin2 } from "@lib/utils";

type CreateTargetSpec = StreamPatchPayload["multistream"]["targets"][number];

const CreateTargetDialog = ({
  isOpen,
  onOpenChange,
  stream,
  invalidateStream,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  stream: Stream;
  invalidateStream: () => Promise<void>;
}) => {
  const { patchStream } = useApi();
  const [openSnackbar] = useSnackbar();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [streamKey, setStreamKey] = useState("");
  const [profile, setProfile] = useState("source");
  const resetState = () => {
    setName("");
    setTargetUrl("");
    setStreamKey("");
    setProfile("source");
  };

  const parsedUrl = useMemo(() => {
    let parsed: url.UrlWithParsedQuery;
    try {
      parsed = url.parse(targetUrl, true);
    } catch (err) {}
    if (!streamKey || !parsed) {
      return parsed;
    }

    switch (parsed.protocol) {
      case "rtmp:":
      case "rtmps:":
        parsed.pathname = pathJoin2(parsed.pathname, streamKey);
        break;
      case "srt:":
        parsed.query.streamId = streamKey;
        break;
    }
    return parsed;
  }, [targetUrl, streamKey]);

  const saveMultistreamTarget = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const targets: CreateTargetSpec[] = [
        ...(stream.multistream?.targets ?? []),
        {
          profile,
          spec: {
            name: name || parsedUrl?.host,
            url: url.format(parsedUrl),
          },
        },
      ];
      await patchStream(stream.id, { multistream: { targets } });
      await invalidateStream();
      onOpenChange(false);
      openSnackbar(`Successfully created multistream target ${name}`);
      resetState();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const profileOpts = useMemo(() => {
    const sourceProfile = {
      name: "source",
      displayName: "Source",
      tooltip: "Original video",
    };
    const fromStream = stream.profiles?.map(({ name, width, height, fps }) => ({
      name,
      displayName: name,
      tooltip: `${width}x${height} @ ${fps || "Source"} FPS`,
    }));
    return [sourceProfile, ...fromStream];
  }, [stream.profiles]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent
        css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}
        onOpenAutoFocus={(e) => e.preventDefault()}>
        <AlertDialogTitle as={Heading} size="1">
          Create a new multistream target
        </AlertDialogTitle>

        <Box
          css={{ mt: "$3" }}
          as="form"
          onSubmit={(e) => {
            e.preventDefault();
            return saveMultistreamTarget();
          }}>
          <Flex direction="column" gap="2">
            <Label htmlFor="targetName">Name</Label>
            <TextField
              size="2"
              type="text"
              id="targetName"
              value={name}
              placeholder={parsedUrl?.host || "e.g. streaming.tv"}
              onChange={(e) => setName(e.target.value)}
            />

            <Label htmlFor="targetUrl">Target URL</Label>
            <TextField
              required
              autoFocus
              size="2"
              type="url"
              id="targetUrl"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="e.g. rtmp://streaming.tv/live"
            />

            <Label htmlFor="streamKey">Stream key (optional)</Label>
            <TextField
              size="2"
              type="text"
              id="streamKey"
              value={streamKey}
              onChange={(e) => setStreamKey(e.target.value)}
              placeholder="e.g. a1b2-4d3c-e5f6-8h7g"
            />
            <Text size="1" css={{ fontWeight: 500, color: "$gray9" }}>
              Stream key should be included if not already present in the URL.
            </Text>

            <Label htmlFor="profile">Profile</Label>
            <Box
              css={{
                width: "100%",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                margin: "0px",
              }}>
              <RadioGroup onValueChange={(e) => setProfile(e.target.value)}>
                <Box css={{ display: "flex", flexDirection: "column" }}>
                  {profileOpts.map((p) => (
                    <Box key={p.name} css={{ display: "flex", mb: "$2" }}>
                      <Radio
                        value={p.name}
                        id={`profile-${p.name}`}
                        checked={profile === p.name}
                      />
                      <Tooltip multiline content={p.tooltip}>
                        <Label
                          css={{ pl: "$2", cursor: "default" }}
                          htmlFor={`profile-${p.name}`}>
                          {p.displayName || p.name}
                        </Label>
                      </Tooltip>
                      {/* <Label htmlFor="profile-source">source</Label> */}
                    </Box>
                  ))}
                </Box>
              </RadioGroup>
            </Box>
          </Flex>
          <AlertDialogDescription
            as={Text}
            size="3"
            variant="gray"
            css={{ mt: "$2", fontSize: "$2", mb: "$4" }}>
            Future stream sessions will have the specified profile automatically
            pushed to the target URL. In progress stream sessions need to be
            restarted to get the update.
          </AlertDialogDescription>

          <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
            <AlertDialogCancel disabled={saving} size="2" as={Button} ghost>
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
              Create target
            </Button>
          </Flex>
        </Box>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateTargetDialog;
