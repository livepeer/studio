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
  DropdownMenuItem,
} from "@livepeer.com/design-system";
import { useState } from "react";
import { useApi } from "../../../hooks";
import Spinner from "components/Dashboard/Spinner";

const Terminate = ({ stream, invalidate, ...props }) => {
  const initialMessage = `Are you sure you want to terminate (stop running live) stream
    ${stream.name}? Terminating a stream will break RTMPconnection.`;

  const { terminateStream } = useApi();
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(initialMessage);

  return (
    <AlertDialog open={open} onOpenChange={() => setOpen(!open)} {...props}>
      <Box
        as={DropdownMenuItem}
        color="red"
        onSelect={(e) => {
          e.preventDefault();
          setOpen(true);
        }}>
        Terminate
      </Box>

      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle as={Heading} size="1">
          Terminate stream?
        </AlertDialogTitle>
        <AlertDialogDescription
          as={Text}
          size="3"
          variant="gray"
          css={{ mt: "$2", lineHeight: "22px" }}>
          {message}
        </AlertDialogDescription>
        <Flex css={{ jc: "flex-end", gap: "$3", mt: "$5" }}>
          <AlertDialogCancel
            size="2"
            onClick={() => {
              setMessage(initialMessage);
              setOpen(false);
            }}
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
              try {
                setSaving(true);
                await terminateStream(stream.id);
                await invalidate();
                setSaving(false);
                setOpen(false);
              } catch (e) {
                setMessage(e.toString());
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
            Terminate
          </AlertDialogAction>
        </Flex>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default Terminate;
