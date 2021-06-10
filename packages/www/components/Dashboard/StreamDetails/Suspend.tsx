import {
  Box,
  Button,
  Flex,
  Dialog,
  DialogContent,
  DialogClose,
  Text,
  Switch,
} from "@livepeer.com/design-system";
import { useState } from "react";
import { useApi } from "../../../hooks";
import Spinner from "@components/Dashboard/Spinner";

const Suspend = ({ stream, setStream }) => {
  const { setRecord } = useApi();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open}>
      <Switch
        checked={!!stream.record}
        name="record-mode"
        value={`${!!stream.record}`}
        onCheckedChange={async () => {
          if (!stream.record) {
            await setRecord(stream.id, true);
            setStream({ ...stream, record: true });
          } else {
            setOpen(true);
          }
        }}
      />

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
                await setRecord(stream.id, false);
                setStream({ ...stream, record: false });
                setSaving(false);
                setOpen(false);
              }}
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
              Suspend stream
            </Button>
          </Flex>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default Suspend;
