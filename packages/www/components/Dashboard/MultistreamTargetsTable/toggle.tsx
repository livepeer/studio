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
  DropdownMenuItem,
  Heading,
  Text,
  Switch,
  useSnackbar,
} from "@livepeer.com/design-system";
import { useState } from "react";
import { useApi } from "../../../hooks";
import Spinner from "components/Dashboard/Spinner";
import { MultistreamTarget } from "../../../../api/src/schema/types";

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

export default Toggle;
