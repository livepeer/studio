import { useCallback, useMemo, useState } from "react";
import { DotsHorizontalIcon as Overflow } from "@radix-ui/react-icons";

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
  target?: MultistreamTarget;
  invalidate: () => Promise<void>;
}) => {
  const { patchMultistreamTarget } = useApi();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [openSnackbar] = useSnackbar();

  return (
    <AlertDialog open={open} onOpenChange={() => setOpen(!open)}>
      <Switch
        disabled={!target}
        checked={!target?.disabled}
        name="multistream-target-toggle"
        value={`${!target?.disabled}`}
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
          <AlertDialogCancel
            size="2"
            onClick={() => setOpen(false)}
            disabled={saving}
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
  invalidateStream,
}: {
  target?: MultistreamTarget;
  stream: Stream;
  invalidateStream: (optm: Stream) => Promise<void>;
}) => {
  const { patchStream, deleteMultistreamTarget } = useApi();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Box
        as={DropdownMenuItem}
        disabled={!target}
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
          size="3"
          variant="gray"
          css={{ mt: "$2", lineHeight: "22px" }}>
          Deleting a target cannot be undone. Any active sessions will continue
          to be multistreamed to this destination.
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
              e.preventDefault();
              setSaving(true);
              try {
                const targets = stream.multistream.targets.filter(
                  (t) => t.id !== target.id
                );
                await patchStream(stream.id, { multistream: { targets } });
                await deleteMultistreamTarget(target.id);
                setOpen(false);
                await invalidateStream({ ...stream, multistream: { targets } });
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
  invalidateStream: (optm: Stream) => Promise<void>;
}) => {
  const invalidateTarget = useCallback(
    () => invalidateTargetId(target?.id),
    [invalidateTargetId, target?.id]
  );
  return (
    <Flex align="center" gap="2" justify="end">
      <Toggle target={target} invalidate={invalidateTarget} />
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
            <Delete
              target={target}
              stream={stream}
              invalidateStream={invalidateStream}
            />
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </Flex>
  );
};

export default Toolbox;
