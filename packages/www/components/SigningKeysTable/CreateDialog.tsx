import { Box, Flex, TextField, Text, Heading } from "@livepeer/design-system";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { useState, useEffect } from "react";
import { useApi } from "../../hooks";
import Spinner from "components/Spinner";
import { SigningKeyResponsePayload } from "@livepeer.studio/api";
import ClipTextArea from "../Clipping/ClipTextArea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "components/ui/dialog";

const CreateDialog = ({
  isOpen,
  onOpenChange,
  onCreateSuccess,
  onClose,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreateSuccess: undefined | (() => void);
  onClose: () => void;
}) => {
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        {!newKey && (
          <>
            <DialogTitle>
              <Heading size="1">New Signing Key</Heading>
            </DialogTitle>
            <Box as="form" onSubmit={createNewKey}>
              <DialogDescription asChild>
                <Text
                  size="3"
                  variant="neutral"
                  css={{ mt: "$2", lineHeight: "22px", mb: "$2" }}>
                  Enter a name for your signing key to differentiate it from
                  other keys.
                </Text>
              </DialogDescription>

              <Input
                type="text"
                required
                id="keyName"
                autoFocus={true}
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g. New key"
              />

              <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button disabled={isLoading} type="submit">
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
            <DialogTitle>
              <Heading size="2" css={{ mb: "$4" }}>
                Here's your new signing key pair
              </Heading>
            </DialogTitle>

            <DialogDescription asChild>
              <Flex
                direction="column"
                css={{ mt: "$2", lineHeight: "22px", mb: "$2" }}>
                <Text size="3" css={{ mb: "$2", fontWeight: 500 }}>
                  Public key
                </Text>
                <ClipTextArea
                  value={newKey.publicKey}
                  text={newKey.publicKey}
                />

                <Text size="3" css={{ mt: "$5", fontWeight: 500 }}>
                  Private key
                </Text>
                <Text size="3" variant="neutral" css={{ mb: "$2" }}>
                  Make sure you save it - you won't be able to access it again.
                </Text>
                <ClipTextArea
                  value={newKey.privateKey}
                  text={newKey.privateKey}
                />
              </Flex>
            </DialogDescription>

            <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
              <Button variant="outline" onClick={() => onClose()}>
                Close
              </Button>
            </Flex>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateDialog;
