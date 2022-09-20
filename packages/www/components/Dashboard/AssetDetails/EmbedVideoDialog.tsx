import { Dialog, DialogContent, DialogTitle, Heading, Box, Flex, Button, Text, TextField } from "@livepeer/design-system";
import { Asset } from "livepeer";

const embedStringForAsset = (asset: Asset) => `
<iframe
src="https://lvpr.tv?v=${asset.playbackId}"
frameborder="0"
allowfullscreen
allow="autoplay; encrypted-media; picture-in-picture"
sandbox="allow-scripts">
</iframe>
`;

export type EmbedVideoDialog = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  asset: Asset;
}

const EmbedVideoDialog = ({
  isOpen,
  onOpenChange,
  asset,
}: EmbedVideoDialog) => {

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        css={{
          maxWidth: 450,
          minWidth: 350,
          px: "$5",
          pt: "$4",
          pb: "$4",
          zIndex: 5,
        }}>

        <DialogTitle asChild>
          <Heading size="1">Embed Video</Heading>
        </DialogTitle>

        <Flex direction="column">
          <Text css={{ mt: "$3" }}>
            Copy and paste this code into your website.
          </Text>

          <TextField
            css={{ mt: "$1" }}
            size="2"
            id="name"
            type="text"
            autoFocus={true}
            value={embedStringForAsset(asset)}
            contentEditable={false}
          />

          <Button
            css={{ mt: "$3", alignSelf: "flex-end" }}
            size="2"
            variant="primary">
            Copy Code
          </Button>
        </Flex>

      </DialogContent>
    </Dialog>
  );
};

export default EmbedVideoDialog;
