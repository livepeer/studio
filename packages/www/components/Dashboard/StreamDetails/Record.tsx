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
import Spinner from "@components/Dashboard/Spinner";

const queryKey = "streamsIdQueryKey";

const Record = ({ stream, revalidate, isSwitch = true }) => {
  const { setRecord } = useApi();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [openSnackbar] = useSnackbar();

  return (
    <AlertDialog open={open}>
      {isSwitch ? (
        <Switch
          checked={!!stream.record}
          name="record-mode"
          value={`${!!stream.record}`}
          onCheckedChange={async () => {
            if (!stream.record) {
              await setRecord(stream.id, true);
              revalidate(queryKey);
              openSnackbar("Recording has been turned on.");
            } else {
              setOpen(true);
            }
          }}
        />
      ) : (
        <Box
          as={DropdownMenuItem}
          onSelect={async (e) => {
            e.preventDefault();
            if (!stream.record) {
              await setRecord(stream.id, true);
              revalidate(queryKey);
              openSnackbar("Recording has been turned on.");
            } else {
              setOpen(true);
            }
          }}>
          <Box>{!stream.record ? "Enable recording" : "Disable recording"}</Box>
        </Box>
      )}

      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle as={Heading} size="1">
          Disable recording?
        </AlertDialogTitle>
        <AlertDialogDescription
          as={Text}
          size="3"
          variant="gray"
          css={{ mt: "$2", lineHeight: "22px" }}>
          Future stream sessions will not be recorded. In progress stream
          sessions will be recorded. Past sessions recordings will still be
          available.
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
            onClick={async () => {
              setSaving(true);
              await setRecord(stream.id, !stream.record);
              revalidate(queryKey);
              openSnackbar("Recording has been turned off.");
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
            Disable recording
          </AlertDialogAction>
        </Flex>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default Record;
