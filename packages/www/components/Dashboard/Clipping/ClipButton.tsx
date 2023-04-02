import {
  useSnackbar,
  HoverCardRoot,
  HoverCardTrigger,
  Flex,
  Box,
  HoverCardContent,
  Text,
} from "@livepeer/design-system";
import { CopyIcon } from "@radix-ui/react-icons";
import { useState, useEffect } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

const ClipButton = ({
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
        <Flex css={{ ai: "center" }}>
          <CopyToClipboard
            text={value}
            onCopy={() => {
              openSnackbar(snackbarMessage);
              setIsCopied(2000);
            }}>
            <Flex
              css={{
                alignItems: "center",
                cursor: "pointer",
                ml: 0,
                mr: 0,
              }}>
              {text !== undefined && <Box css={{ mr: "$1" }}>{text}</Box>}
              <CopyIcon
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
          variant="neutral"
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

export default ClipButton;
