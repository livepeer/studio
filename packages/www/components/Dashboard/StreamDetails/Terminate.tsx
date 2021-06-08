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
import { Stream } from "@livepeer.com/api";

const Terminate = ({ stream, setStream, ...props }) => {
  const initialMessage = `Are you sure you want to terminate (stop running live) stream
    ${stream.name}? Terminating a stream will break RTMPconnection.`;

  const { terminateStream } = useApi();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(initialMessage);

  return (
    <Dialog open={open} {...props}>
      <Box
        css={{ color: "$red9" }}
        onClick={() => {
          setOpen(true);
        }}>
        Terminate
      </Box>

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
            Are you you want to terminate this stream?
          </Text>
          <Text size="2" variant="gray" css={{ lineHeight: "17px" }}>
            {message}
          </Text>
          <Flex
            css={{
              mt: "$4",
              ai: "center",
              jc: "flex-end",
            }}>
            <Button
              disabled={saving}
              onClick={() => {
                setMessage(initialMessage);
                setOpen(false);
              }}
              size="2"
              css={{ mr: "$2" }}>
              Cancel
            </Button>
            <Button
              css={{ display: "flex", ai: "center" }}
              size="2"
              disabled={saving}
              onClick={async () => {
                try {
                  setSaving(true);
                  const res = await terminateStream(stream.id);
                  setStream({ ...stream });
                  setSaving(false);
                  setMessage(initialMessage);
                  setOpen(false);
                } catch (e) {
                  setMessage(e.toString());
                  setSaving(false);
                }
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
              Terminate
            </Button>
          </Flex>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default Terminate;
