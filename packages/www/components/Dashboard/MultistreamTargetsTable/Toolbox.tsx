import { useCallback, useMemo, useState } from "react";
import { DotsHorizontalIcon as Overflow } from "@radix-ui/react-icons";

import {
  Button,
  Flex,
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  Heading,
  Text,
  Switch,
  useSnackbar,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@livepeer.com/design-system";

import Spinner from "components/Dashboard/Spinner";

import { useApi } from "../../../hooks";
import { MultistreamTarget, Stream } from "../../../../api/src/schema/types";
import SaveTargetDialog, { Action } from "./SaveTargetDialog";

const DisableDialog = ({
  onDialogAction,
  open,
  setOpen,
}: {
  onDialogAction: () => Promise<void>;
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const [saving, setSaving] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={() => setOpen(!open)}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle as={Heading} size="1">
          Disable multistream target?
        </AlertDialogTitle>
        <AlertDialogDescription
          as={Text}
          size="3"
          variant="gray"
          css={{ mt: "$2", lineHeight: "22px" }}>
          Changes will take effect when the next stream session is started.
        </AlertDialogDescription>

        <Flex css={{ jc: "flex-end", gap: "$3", mt: "$5" }}>
          <AlertDialogCancel size="2" disabled={saving} as={Button} ghost>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            size="2"
            as={Button}
            disabled={saving}
            onClick={async (e) => {
              e.preventDefault();
              setSaving(true);
              await onDialogAction();
              setSaving(false);
              setOpen(false);
            }}
            variant="red">
            {saving && (
              <Spinner
                css={{
                  width: 16,
                  height: 16,
                  mr: "$2",
                }}
              />
            )}
            Disable target
          </AlertDialogAction>
        </Flex>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const DeleteDialog = ({
  target,
  stream,
  invalidateStream,
  open,
  setOpen,
}: {
  target?: MultistreamTarget;
  stream: Stream;
  invalidateStream: (optm: Stream) => Promise<void>;
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const { patchStream, deleteMultistreamTarget } = useApi();
  const [saving, setSaving] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle as={Heading} size="1">
          Delete multistream target?
        </AlertDialogTitle>
        <AlertDialogDescription
          as={Text}
          size="3"
          variant="gray"
          css={{ mt: "$2", lineHeight: "22px" }}>
          Deleting a target cannot be undone. Any active sessions will continue
          to be multistreamed to this destination.
        </AlertDialogDescription>

        <Flex css={{ jc: "flex-end", gap: "$3", mt: "$5" }}>
          <AlertDialogCancel size="2" as={Button} ghost>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            as={Button}
            size="2"
            disabled={saving}
            onClick={async (e) => {
              e.preventDefault();
              setSaving(true);
              try {
                const targets = stream.multistream.targets.filter(
                  (t) => t.id !== target.id
                );
                const patch = { multistream: { targets } };
                await patchStream(stream.id, patch);
                await deleteMultistreamTarget(target.id);
                setOpen(false);
                await invalidateStream({ ...stream, ...patch });
              } finally {
                setSaving(false);
              }
            }}
            variant="red">
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
            Delete
          </AlertDialogAction>
        </Flex>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const Toolbox = ({
  target,
  stream,
  invalidateTargetId,
  invalidateStream,
}: {
  target?: MultistreamTarget;
  stream: Stream;
  invalidateTargetId: (id: string) => Promise<void>;
  invalidateStream: (optm?: Stream) => Promise<void>;
}) => {
  const { patchMultistreamTarget } = useApi();
  const [openSnackbar] = useSnackbar();

  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const setTargetDisabled = useCallback(
    async (disabled: boolean) => {
      await patchMultistreamTarget(target.id, { disabled });
      await invalidateTargetId(target?.id);
      openSnackbar(
        `Target ${target.name} has been turned ${disabled ? "off" : "on"}.`
      );
    },
    [
      patchMultistreamTarget,
      invalidateTargetId,
      openSnackbar,
      target?.id,
      target?.name,
      target?.disabled,
    ]
  );
  const invalidateAll = useCallback(async () => {
    await Promise.all([invalidateStream(), invalidateTargetId(target?.id)]);
  }, [invalidateStream, invalidateTargetId, target?.id]);
  const currProfile = useMemo(() => {
    const ref = stream?.multistream?.targets?.find((t) => t.id == target?.id);
    return ref?.profile;
  }, [stream?.multistream?.targets, target?.id]);

  return (
    <Flex align="center" gap="2" justify="end">
      <Switch
        name="multistream-target-toggle"
        disabled={!target}
        checked={!target?.disabled}
        value={`${!target?.disabled}`}
        onCheckedChange={useCallback(async () => {
          if (target?.disabled) {
            await setTargetDisabled(false);
          } else {
            setDisableDialogOpen(true);
          }
        }, [target?.disabled, setTargetDisabled])}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          as={Button}
          ghost
          size="1"
          css={{
            display: "flex",
            ai: "center",
            "&:hover": { boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.5)" },
          }}>
          <Overflow />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem
              disabled={!target}
              onSelect={() => setSaveDialogOpen(true)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!target}
              onSelect={() => setDeleteDialogOpen(true)}
              color="red">
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DisableDialog
        onDialogAction={useCallback(
          () => setTargetDisabled(true),
          [setTargetDisabled]
        )}
        open={disableDialogOpen}
        setOpen={setDisableDialogOpen}
      />
      <SaveTargetDialog
        action={Action.Update}
        isOpen={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        stream={stream}
        target={target}
        initialProfile={currProfile}
        invalidate={invalidateAll}
      />
      <DeleteDialog
        target={target}
        stream={stream}
        invalidateStream={invalidateStream}
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
      />
    </Flex>
  );
};

export default Toolbox;
