import {
  Box,
  Flex,
  HoverCardContent,
  HoverCardRoot,
  HoverCardTrigger,
  Link as A,
  useSnackbar,
  Text,
} from "@livepeer/design-system";
import { useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { CopyIcon as Copy } from "@radix-ui/react-icons";

export type ShowURLProps = {
  url: string;
  shortendUrl?: string;
  anchor?: boolean;
};

const ShowURL = ({ url, shortendUrl, anchor = false }: ShowURLProps) => {
  const [isCopied, setCopied] = useState(0);
  const [openSnackbar] = useSnackbar();

  useEffect(() => {
    if (isCopied) {
      const interval = setTimeout(() => {
        setCopied(0);
      }, isCopied);
      return () => clearTimeout(interval);
    }
  }, [isCopied]);

  return (
    <HoverCardRoot openDelay={200}>
      <HoverCardTrigger>
        <Flex css={{ ai: "center" }}>
          <CopyToClipboard
            text={url}
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
              {anchor ? (
                <A
                  css={{ fontSize: "$2", mr: "$1" }}
                  href={url}
                  target="_blank">
                  {shortendUrl ? shortendUrl : url}
                </A>
              ) : (
                <Box css={{ fontSize: "$2", mr: "$1" }}>
                  {shortendUrl ? shortendUrl : url}
                </Box>
              )}
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

export default ShowURL;
