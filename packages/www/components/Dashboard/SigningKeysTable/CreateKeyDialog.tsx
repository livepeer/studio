import {
  Box,
  Button,
  Flex,
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  TextField,
  Text,
  Heading,
  HoverCardRoot,
  HoverCardContent,
  HoverCardTrigger,
  useSnackbar,
  Alert,
} from "@livepeer/design-system";
import { useState, useEffect } from "react";
import { useApi } from "../../../hooks";
import Spinner from "components/Dashboard/Spinner";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { SigningKeyResponsePayload } from "@livepeer.studio/api";

type Props = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreateSuccess: undefined | (() => void);
  onClose: () => void;
};

const ClipBut = ({ text }) => {
  const [isCopied, setCopied] = useState(0);
  const [openSnackbar] = useSnackbar();

  useEffect(() => {
    if (isCopied) {
      const timeout = setTimeout(() => setCopied(0), isCopied);
      return () => clearTimeout(timeout);
    }
  }, [isCopied]);

  return (
    <HoverCardRoot openDelay={200}>
      <HoverCardTrigger>
        <Flex direction="column">
          <CopyToClipboard
            text={text}
            onCopy={() => {
              openSnackbar("Copied to clipboard");
              setCopied(2000);
            }}>
            <Flex direction="column">
              <Alert
                css={{
                  cursor: "pointer",
                  overflow: "clip",
                  overflowWrap: "anywhere",
                  backgroundColor: "$gray4",
                }}>
                <Text size="2">{text}</Text>
              </Alert>
            </Flex>
          </CopyToClipboard>
        </Flex>
      </HoverCardTrigger>
      <HoverCardContent>
        <Text
          variant="gray"
          css={{
            backgroundColor: "$panel",
            borderRadius: 6,
            px: "$3",
            py: "$1",
            fontSize: "$1",
            display: "flex",
            ai: "center",
          }}>
          <Box>{isCopied ? "Copied" : "Copy to Clipboard"}</Box>
        </Text>
      </HoverCardContent>
    </HoverCardRoot>
  );
};

const CreateKeyDialog = ({
  isOpen,
  onOpenChange,
  onCreateSuccess,
  onClose,
}: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [keyName, setKeyName] = useState("");
  const { createSigningKey } = useApi();
  const [isCopied, setCopied] = useState(0);
  const [newKey, setNewKey] = useState<SigningKeyResponsePayload | null>(null);

  useEffect(() => {
    setNewKey(null);
    setKeyName("");
  }, [isOpen]);

  useEffect(() => {
    if (!isCopied) return;
    const interval = setTimeout(() => setCopied(0), isCopied);
    return () => clearTimeout(interval);
  }, [isCopied]);

  const createNewKey = async (event) => {
    event.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      const newKey = await createSigningKey({ name: keyName });
      setNewKey(newKey);
      onCreateSuccess?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        {!newKey && (
          <>
            <AlertDialogTitle asChild>
              <Heading size="1">New Signing Key</Heading>
            </AlertDialogTitle>
            <Box as="form" onSubmit={createNewKey}>
              <AlertDialogDescription asChild>
                <Text
                  size="3"
                  variant="gray"
                  css={{ mt: "$2", lineHeight: "22px", mb: "$2" }}>
                  Enter a name for your signing key to differentiate it from
                  other keys.
                </Text>
              </AlertDialogDescription>

              <TextField
                size="2"
                type="text"
                required
                id="keyName"
                autoFocus={true}
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g. New key"
              />

              <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
                <AlertDialogCancel asChild>
                  <Button size="2" ghost>
                    Cancel
                  </Button>
                </AlertDialogCancel>
                <Button
                  size="2"
                  disabled={isLoading}
                  type="submit"
                  variant="primary">
                  {isLoading && (
                    <Spinner
                      css={{
                        color: "$hiContrast",
                        width: 16,
                        height: 16,
                        mr: "$2",
                      }}
                    />
                  )}
                  Create
                </Button>
              </Flex>
            </Box>
          </>
        )}

        {newKey && (
          <Box>
            <AlertDialogTitle asChild>
              <Heading size="2" css={{ mb: "$4" }}>
                Here's your new signing key pair
              </Heading>
            </AlertDialogTitle>

            <AlertDialogDescription asChild>
              <Flex
                direction="column"
                css={{ mt: "$2", lineHeight: "22px", mb: "$2" }}>
                <Text size="3" css={{ mb: "$2", fontWeight: 500 }}>
                  Public key
                </Text>
                <ClipBut text={newKey.publicKey} />

                <Text size="3" css={{ mt: "$5", fontWeight: 500 }}>
                  Private key
                </Text>
                <Text size="3" variant="gray" css={{ mb: "$2" }}>
                  Make sure you save it - you won't be able to access it again.
                </Text>
                <ClipBut text={newKey.privateKey} />
              </Flex>
            </AlertDialogDescription>

            <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
              <Button variant="blue" onClick={() => onClose()} size="2">
                Continue
              </Button>
            </Flex>
          </Box>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateKeyDialog;
