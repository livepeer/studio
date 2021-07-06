import {
  Box,
  Button,
  Flex,
  Dialog,
  DialogContent,
  DropdownMenuItem,
  Text,
  Switch,
  useSnackbar,
} from "@livepeer.com/design-system";
import { useState } from "react";
import { useApi } from "../../../hooks";
import Spinner from "@components/Dashboard/Spinner";

const Record = ({ stream, setStream, isSwitch = true }) => {
  const { setRecord } = useApi();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [openSnackbar] = useSnackbar();

  return (
    <Dialog open={open}>
      {isSwitch ? (
        <Switch
          checked={!!stream.record}
          name="record-mode"
          value={`${!!stream.record}`}
          onCheckedChange={async () => {
            if (!stream.record) {
              await setRecord(stream.id, true);
              setStream({ ...stream, record: true });
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
              setStream({ ...stream, record: true });
              openSnackbar("Recording has been turned on.");
            } else {
              setOpen(true);
            }
          }}>
          <Box>
            {!stream.record ? "Turn on recording" : "Turn off recording"}
          </Box>
        </Box>
      )}

      <DialogContent css={{ p: 0 }}>
        <Box
          css={{
            maxWidth: 450,
            px: "$5",
            pt: "$5",
            pb: "$4",
          }}>
          <Text
            size="4"
            css={{
              fontWeight: 500,
              lineHeight: "20px",
              mb: "$3",
            }}>
            Are you you want to turn off recording?
          </Text>
          <Text size="2" variant="gray" css={{ lineHeight: "17px" }}>
            Future stream sessions will not be recorded. In progress stream
            sessions will be recorded. Past sessions recordings will still be
            available.
          </Text>
          <Flex
            css={{
              mt: "$4",
              ai: "center",
              jc: "flex-end",
            }}>
            <Button
              disabled={saving}
              onClick={() => setOpen(false)}
              size="2"
              css={{ mr: "$2" }}>
              Cancel
            </Button>
            <Button
              css={{ display: "flex", ai: "center" }}
              size="2"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                await setRecord(stream.id, !stream.record);
                setStream({ ...stream, record: !stream.record });
                openSnackbar("Recording has been turned off.");
                setSaving(false);
                setOpen(false);
              }}
              variant="violet">
              {saving && (
                <Spinner
                  css={{
                    width: 16,
                    height: 16,
                    mr: "$2",
                  }}
                />
              )}
              Turn off recording
            </Button>
          </Flex>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default Record;
