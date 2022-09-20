import { Asset } from "livepeer";
import { ReactNode } from "react";
import { Popover, PopoverTrigger, PopoverContent, Box, Button, Flex } from "@livepeer/design-system";
import { CodeIcon, Link1Icon } from "@radix-ui/react-icons";

const buttonLinkCss = {
  display: "flex",
  justifyContent: "flex-start",
  color: "$hiContrast"
}

export type AssetSharePopupProps = {
  triggerNode: ReactNode;
  asset?: Asset;
}

const AssetSharePopup = ({ triggerNode, asset }: AssetSharePopupProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {triggerNode}
      </PopoverTrigger>

      <PopoverContent
        hideArrow={false}
        css={{ padding: "$2" }}>

        <Flex css={{
          gap: "$1",
          flexDirection: "column",
        }}>
          <Button
            size="2"
            onClick={() => {}}
            ghost={true}
            css={buttonLinkCss}>
            <Box
              as={Link1Icon}
              css={{
                mr: "$1",
                flex: "shrink"
              }}
            />
            Copy link
          </Button>
          <Button
            size="2"
            onClick={() => {}}
            ghost={true}
            css={buttonLinkCss}>
            <Box
              as={CodeIcon}
              css={{
                mr: "$1",
              }}
            />
            Embed
          </Button>
        </Flex>

      </PopoverContent>
    </Popover>
  )
}

export default AssetSharePopup;
