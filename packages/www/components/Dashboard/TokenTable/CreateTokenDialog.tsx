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
  styled,
} from "@livepeer.com/design-system";
import { useState, useEffect } from "react";
import { useApi } from "../../../hooks";
import Spinner from "@components/Dashboard/Spinner";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { ApiToken } from "../../../../api/src/schema/types";

type Props = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreateSuccess: undefined | (() => void);
  onClose: () => void;
};

const CreateTokenDialog = ({
  isOpen,
  onOpenChange,
  onCreateSuccess,
  onClose,
}: Props) => {
  const [creating, setCreating] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const { createApiToken } = useApi();
  const [isCopied, setCopied] = useState(0);
  const [newToken, setNewToken] = useState<ApiToken | null>(null);

  useEffect(() => {
    if (isCopied) {
      const interval = setTimeout(() => {
        setCopied(0);
      }, isCopied);
      return () => clearTimeout(interval);
    }
  }, [isCopied]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        {!newToken && (
          <>
            <AlertDialogTitle as={Heading} size="1">
              Create key
            </AlertDialogTitle>
            <Box
              as="form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (creating) {
                  return;
                }
                setCreating(true);
                try {
                  const _newToken = await createApiToken({ name: tokenName });
                  setNewToken(_newToken);
                  onCreateSuccess?.();
                } finally {
                  setCreating(false);
                }
              }}>
              <AlertDialogDescription
                as={Text}
                size="3"
                variant="gray"
                css={{ mt: "$2", lineHeight: "22px", mb: "$2" }}>
                Enter a name for your key to differentiate it from other keys.
              </AlertDialogDescription>

              <Flex direction="column" gap="2">
                <TextField
                  size="2"
                  type="text"
                  required
                  id="tokenName"
                  autoFocus={true}
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="e.g. New key"
                />
              </Flex>

              <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
                <AlertDialogCancel size="2" as={Button} ghost>
                  Cancel
                </AlertDialogCancel>
                <Button
                  size="2"
                  disabled={creating}
                  type="submit"
                  variant="violet">
                  {creating && (
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
        {newToken && (
          <Box>
            <AlertDialogTitle as={Heading} size="1">
              Token Created
            </AlertDialogTitle>
            <AlertDialogDescription
              as={Text}
              size="3"
              variant="gray"
              css={{ mt: "$2", lineHeight: "22px", mb: "$2" }}>
              <Box>
                <Box css={{ mb: "$2" }}>Here's your new API key:</Box>
                <CopyToClipboard
                  text={newToken.id}
                  onCopy={() => setCopied(2000)}>
                  <Button
                    ghost
                    size="2"
                    variant="transparentBlack"
                    css={{ cursor: "pointer" }}>
                    {newToken.id}
                  </Button>
                </CopyToClipboard>
              </Box>
            </AlertDialogDescription>
            <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
              <Button
                onClick={() => {
                  setNewToken(null);
                  setTokenName("");
                  onClose();
                }}
                size="2">
                Close
              </Button>
            </Flex>
          </Box>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateTokenDialog;
