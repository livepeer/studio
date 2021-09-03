import { useCallback, useEffect, useMemo, useState } from "react";
import url from "url";

import {
  Badge,
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
import {
  MultistreamTarget,
  MultistreamTargetPatchPayload,
  Stream,
  StreamPatchPayload,
} from "../../../../api/src/schema/types";
import { pathJoin2 } from "@lib/utils";

type CreateTargetSpec = StreamPatchPayload["multistream"]["targets"][number];

export enum Action {
  Create = "Create",
  Update = "Update",
}

type State = {
  name: string;
  ingestUrl: string;
  streamKey: string;
  profile: string;
};

type Api = ReturnType<typeof useApi>;

const parseUrl = (ingestUrl: string, streamKey: string) => {
  let parsed: url.UrlWithParsedQuery;
  try {
    if (ingestUrl) {
      parsed = url.parse(ingestUrl, true);
    }
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
};

const createTarget = (
  api: Api,
  stream: Stream,
  state: State,
  parsedUrl: url.UrlWithParsedQuery
) => {
  const targets: CreateTargetSpec[] = [
    ...(stream.multistream?.targets ?? []),
    {
      profile: state.profile,
      spec: {
        name: state.name || parsedUrl?.host,
        url: url.format(parsedUrl),
      },
    },
  ];
  return api.patchStream(stream.id, { multistream: { targets } });
};

const updateTarget = async (
  api: Api,
  stream: Stream,
  targetId: string,
  state: State,
  parsedUrl: url.UrlWithParsedQuery,
  initState: State
) => {
  const patch = {
    name: state.name !== initState.name ? state.name : undefined,
    url: parsedUrl ? url.format(parsedUrl) : undefined,
  };
  if (patch.name || patch.url) {
    await api.patchMultistreamTarget(targetId, patch);
  }
  if (state.profile !== initState.profile) {
    const targets: CreateTargetSpec[] = stream.multistream?.targets?.map(
      (t) => ({
        ...t,
        profile: t.id === targetId ? state.profile : t.profile,
      })
    );
    await api.patchStream(stream.id, { multistream: { targets } });
  }
};

const SaveTargetDialog = ({
  action,
  isOpen,
  onOpenChange,
  stream,
  target,
  initialProfile,
  invalidate,
}: {
  action: Action;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  stream: Stream;
  target?: MultistreamTarget;
  initialProfile?: string;
  invalidate: () => Promise<void>;
}) => {
  const api = useApi();
  const [openSnackbar] = useSnackbar();
  const [saving, setSaving] = useState(false);

  const initState = useMemo(
    () => ({
      name: action === Action.Create ? "" : target?.name,
      ingestUrl: "",
      streamKey: "",
      profile: action === Action.Create ? "source" : initialProfile,
    }),
    [action, target?.name, initialProfile]
  );
  const [state, setState] = useState(initState);
  useEffect(() => setState(initState), [isOpen]);

  const setStateProp = (prop: keyof typeof state, value: string) => {
    setState({ ...state, [prop]: value });
  };

  const parsedUrl = useMemo(
    () => parseUrl(state.ingestUrl, state.streamKey),
    [state.ingestUrl, state.streamKey]
  );

  const saveMultistreamTarget = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (action === Action.Create) {
        await createTarget(api, stream, state, parsedUrl);
      } else {
        const tId = target?.id;
        await updateTarget(api, stream, tId, state, parsedUrl, initState);
      }
      await invalidate();
      onOpenChange(false);
      openSnackbar(
        `Successfully ${
          action === Action.Create ? "created" : "updated"
        } multistream target ${name}`
      );
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
    const fromStream = stream.profiles
      ?.sort(
        (p1, p2) => p1.height - p2.height || p1.name.localeCompare(p2.name)
      )
      .reverse()
      .map(({ name, width, height, fps }) => ({
        name,
        displayName: name,
        tooltip: `${width}x${height} @ ${fps || "Source"} FPS`,
      }));
    return [sourceProfile, ...(fromStream ?? [])];
  }, [stream.profiles]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent
        css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}
        onOpenAutoFocus={(e) => e.preventDefault()}>
        <AlertDialogTitle as={Heading} size="1">
          {`${action} multistream target`}
          {action === Action.Create ? (
            <Badge size="2" variant="violet" css={{ ml: "$2" }}>
              Beta
            </Badge>
          ) : null}
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
              value={state.name}
              placeholder={
                initState.name || parsedUrl?.host || "e.g. streaming.tv"
              }
              onChange={(e) => setStateProp("name", e.target.value)}
            />

            <Label htmlFor="ingestUrl">Ingest URL</Label>
            <TextField
              required={action === Action.Create || !!state.streamKey}
              autoFocus
              size="2"
              type="url"
              pattern="^(srt|rtmps?)://.+"
              id="ingestUrl"
              value={state.ingestUrl}
              onChange={(e) => setStateProp("ingestUrl", e.target.value)}
              placeholder={
                action === Action.Create || !!state.streamKey
                  ? "e.g. rtmp://streaming.tv/live"
                  : "(redacted)"
              }
            />
            <Text size="1" css={{ fontWeight: 500, color: "$gray9" }}>
              Supported protocols: RTMP(S) and SRT
            </Text>

            <Label htmlFor="streamKey">Stream key (optional)</Label>
            <TextField
              size="2"
              type="text"
              autoComplete="off"
              id="streamKey"
              value={state.streamKey}
              onChange={(e) => setStateProp("streamKey", e.target.value)}
              placeholder={
                action === Action.Create || state.ingestUrl
                  ? "e.g. a1b2-4d3c-e5f6-8h7g"
                  : "(redacted)"
              }
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
              <RadioGroup
                onValueChange={(e) => setStateProp("profile", e.target.value)}>
                <Box css={{ display: "flex", flexDirection: "column" }}>
                  {profileOpts.map((p) => (
                    <Box key={p.name} css={{ display: "flex", mb: "$2" }}>
                      <Radio
                        value={p.name}
                        id={`profile-${p.name}`}
                        checked={state.profile === p.name}
                      />
                      <Tooltip multiline content={p.tooltip}>
                        <Label
                          css={{ pl: "$2", cursor: "default" }}
                          htmlFor={`profile-${p.name}`}>
                          {p.displayName || p.name}
                        </Label>
                      </Tooltip>
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
            {`${
              action === Action.Create
                ? "Addition of new multistream targets"
                : "Updating a multistream target"
            } will take effect when the next stream session is started.`}
          </AlertDialogDescription>

          <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
            <AlertDialogCancel disabled={saving} size="2" as={Button} ghost>
              Cancel
            </AlertDialogCancel>
            <Button
              css={{ display: "flex", ai: "center" }}
              type="submit"
              size="2"
              disabled={saving || (action === Action.Update && !target)}
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
              {`${action} target`}
            </Button>
          </Flex>
        </Box>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SaveTargetDialog;
