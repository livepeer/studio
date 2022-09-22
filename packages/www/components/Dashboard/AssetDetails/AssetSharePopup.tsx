import { ReactNode } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Box,
  Button,
  Flex,
  useSnackbar,
} from "@livepeer/design-system";
import { CodeIcon, Link1Icon } from "@radix-ui/react-icons";
import { CopyToClipboard } from "react-copy-to-clipboard";

const buttonLinkCss = {
  display: "flex",
  justifyContent: "flex-start",
  color: "$hiContrast",
};

export type AssetSharePopupProps = {
  playbackId: string;
  triggerNode: ReactNode;
  onEmbedVideoClick: () => void;
};

const AssetSharePopup = ({
  playbackId,
  triggerNode,
  onEmbedVideoClick,
}: AssetSharePopupProps) => {
  const [openSnackbar] = useSnackbar();
  const copyString = `https://lvpr.tv?v=${playbackId}`;

  return (
    <Popover>
      <PopoverTrigger asChild>{triggerNode}</PopoverTrigger>

      <PopoverContent hideArrow={false} css={{ padding: "$2" }}>
        <Flex
          css={{
            gap: "$1",
            flexDirection: "column",
          }}>
          <CopyToClipboard
            text={copyString}
            onCopy={() => openSnackbar("Copied to clipboard")}>
            <Button size="2" ghost={true} css={buttonLinkCss}>
              <Box as={Link1Icon} css={{ mr: "$1" }} />
              Copy link
            </Button>
          </CopyToClipboard>
          <Button
            size="2"
            onClick={() => onEmbedVideoClick()}
            ghost={true}
            css={buttonLinkCss}>
            <Box as={CodeIcon} css={{ mr: "$1" }} />
            Embed
          </Button>
        </Flex>
      </PopoverContent>
    </Popover>
  );
};

export default AssetSharePopup;
