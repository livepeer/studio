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
} from "@livepeer/design-system";
import { useState, useEffect } from "react";
import { useApi } from "../../../hooks";
import Spinner from "components/Dashboard/Spinner";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { SigningKey } from "@livepeer.studio/api";
import { CopyIcon as Copy } from "@radix-ui/react-icons";

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
        <Flex css={{ height: 25, ai: "center" }}>
          <CopyToClipboard
            text={text}
            onCopy={() => {
              openSnackbar("Copied to clipboard");
              setCopied(2000);
            }}>
            <Flex
              css={{
                alignItems: "center",
                cursor: "pointer",
                ml: 0,
                mr: 0,
              }}>
              <Box css={{ mr: "$1" }}>{text}</Box>
              <Copy
                css={{
                  mr: "$2",
                  width: 14,
                  height: 14,
                  color: "$hiContrast",
                }}
              />
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
  const { createSigningKeys } = useApi();
  const [isCopied, setCopied] = useState(0);
  const [newKey, setNewKey] = useState<SigningKey | null>(null);

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
      const newKey = await createSigningKeys({ name: keyName });
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
              <Heading size="1">Token Created</Heading>
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <Text
                size="3"
                variant="gray"
                css={{ mt: "$2", lineHeight: "22px", mb: "$2" }}>
                <Box>
                  <Box css={{ mb: "$2" }}>Here's your new API key:</Box>
                  <Button variant="gray" size="2" css={{ cursor: "pointer" }}>
                    <ClipBut text={newKey.id} />
                  </Button>
                </Box>
              </Text>
            </AlertDialogDescription>
            <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
              <Button onClick={() => onClose()} size="2">
                Close
              </Button>
            </Flex>
          </Box>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateKeyDialog;
