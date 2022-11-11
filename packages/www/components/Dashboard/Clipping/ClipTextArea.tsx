import {
  useSnackbar,
  HoverCardRoot,
  HoverCardTrigger,
  Flex,
  Box,
  HoverCardContent,
  Text,
  Alert,
} from "@livepeer/design-system";
import { useState, useEffect } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

const ClipTextArea = ({
  value,
  text,
  successMessage,
}: {
  value: string;
  text?: string;
  successMessage?: string;
}) => {
  const [isCopied, setIsCopied] = useState(0);
  const [openSnackbar] = useSnackbar();
  const snackbarMessage =
    successMessage !== undefined ? successMessage : "Copied to clipboard";

  useEffect(() => {
    if (!isCopied) return;
    const timeout = setTimeout(() => setIsCopied(0), isCopied);
    return () => clearTimeout(timeout);
  }, [isCopied]);

  return (
    <HoverCardRoot openDelay={200}>
      <HoverCardTrigger>
        <Flex direction="column">
          <CopyToClipboard
            text={value}
            onCopy={() => {
              openSnackbar(snackbarMessage);
              setIsCopied(2000);
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

export default ClipTextArea;
