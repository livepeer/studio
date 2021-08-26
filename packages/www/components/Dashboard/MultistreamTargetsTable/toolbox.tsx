import { useState } from "react";
import {
  DotsHorizontalIcon as Overflow,
  QuestionMarkCircledIcon as Help,
} from "@radix-ui/react-icons";

import {
  Box,
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
  Tooltip,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@livepeer.com/design-system";

import Spinner from "components/Dashboard/Spinner";

import { useApi } from "../../../hooks";
import { MultistreamTarget, Stream } from "../../../../api/src/schema/types";

const Toggle = ({
  target,
  invalidate,
}: {
  target: MultistreamTarget;
  invalidate: () => Promise<void>;
}) => {
  const { patchMultistreamTarget } = useApi();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [openSnackbar] = useSnackbar();

  return (
    <AlertDialog open={open} onOpenChange={() => setOpen(!open)}>
      <Switch
        checked={!target.disabled}
        name="multistream-target-toggle"
        value={`${!target.disabled}`}
        onCheckedChange={async () => {
          if (target.disabled) {
            await patchMultistreamTarget(target.id, { disabled: false });
            await invalidate();
            openSnackbar(`Target ${target.name} has been turned on.`);
          } else {
            setOpen(true);
          }
        }}
      />

      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle as={Heading} size="1">
          Disable this multistream target?
        </AlertDialogTitle>
        <AlertDialogDescription
          as={Text}
          size="3"
          variant="gray"
          css={{ mt: "$2", lineHeight: "22px" }}>
          Future stream sessions will not be multistreamed to this target. In
          progress stream sessions will continue to be.
        </AlertDialogDescription>

        <Flex css={{ jc: "flex-end", gap: "$3", mt: "$5" }}>
          <AlertDialogCancel
            size="2"
            onClick={() => setOpen(false)}
            as={Button}
            ghost>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            size="2"
            as={Button}
            disabled={saving}
            onClick={async (e) => {
              e.preventDefault();
              setSaving(true);
              const disabled = !target.disabled;
              await patchMultistreamTarget(target.id, { disabled });
              await invalidate();
              openSnackbar(`Target ${target.name} has been turned off.`);
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

const Delete = ({
  target,
  stream,
  invalidate,
}: {
  target: MultistreamTarget;
  stream: Stream;
  invalidate: () => Promise<void>;
}) => {
  const { patchStream, deleteMultistreamTarget } = useApi();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={() => setOpen(!open)}>
      <Box
        as={DropdownMenuItem}
        onSelect={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        color="red">
        Delete
      </Box>

      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle as={Heading} size="1">
          Delete multistream target?
        </AlertDialogTitle>
        <AlertDialogDescription
          as={Text}
          size="2"
          variant="gray"
          css={{ mt: "$2", lineHeight: "17px" }}>
          Are you sure you want to delete multistream target {target.name}?
          Delete action cannot be undone.
        </AlertDialogDescription>

        <Flex css={{ jc: "flex-end", gap: "$3", mt: "$5" }}>
          <AlertDialogCancel
            size="2"
            onClick={() => setOpen(false)}
            as={Button}
            ghost>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            as={Button}
            size="2"
            disabled={saving}
            onClick={async (e) => {
              try {
                e.preventDefault();
                setSaving(true);
                const targets = stream.multistream.targets.filter(
                  (t) => t.id !== target.id
                );
                await patchStream(stream.id, { multistream: { targets } });
                await deleteMultistreamTarget(target.id);
                await invalidate();
                setSaving(false);
                setOpen(false);
              } catch (e) {
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
  invalidateTarget,
  invalidateStream,
}: {
  target: MultistreamTarget;
  stream: Stream;
  invalidateTarget: () => Promise<void>;
  invalidateStream: () => Promise<void>;
}) => {
  return (
    <Flex align="stretch" css={{ position: "relative", top: "2px" }}>
      <Box css={{ mr: "$2" }}>
        <Toggle target={target} invalidate={invalidateTarget} />
      </Box>
      <Tooltip
        multiline
        content={<Box>Enable or disable multistreaming to this target.</Box>}>
        <Help />
      </Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger
          as={Button}
          variant="transparentWhite"
          size="1"
          css={{ display: "flex", ai: "center" }}>
          <Overflow />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <Delete
              target={target}
              stream={stream}
              invalidate={() =>
                Promise.all([invalidateTarget(), invalidateStream()]) as any
              }
            />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </Flex>
  );
};

export default Toolbox;
