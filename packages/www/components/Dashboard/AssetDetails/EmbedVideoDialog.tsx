import {
  Dialog,
  DialogContent,
  DialogTitle,
  Heading,
  Flex,
  Button,
  Text,
  TextField,
  useSnackbar,
} from "@livepeer/design-system";
import { CopyToClipboard } from "react-copy-to-clipboard";

const embedStringForAsset = (playbackId: string) =>
  `<iframe src="https://lvpr.tv?v=${playbackId}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture" sandbox="allow-scripts"></iframe>`;

export type EmbedVideoDialog = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  playbackId: string;
};

const EmbedVideoDialog = ({
  isOpen,
  onOpenChange,
  playbackId,
}: EmbedVideoDialog) => {
  const embedString = embedStringForAsset(playbackId);
  const [openSnackbar] = useSnackbar();

  const onCopy = () => {
    onOpenChange(false);
    openSnackbar("Copied to clipboard");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        css={{
          maxWidth: 450,
          minWidth: 350,
          px: "$5",
          pt: "$4",
          pb: "$4",
          zIndex: 1001,
        }}>
        <DialogTitle asChild>
          <Heading size="1">Embed Video</Heading>
        </DialogTitle>

        <Flex direction="column">
          <Text css={{ mt: "$3" }}>
            Copy and paste this code into your website.
          </Text>

          <TextField
            css={{
              mt: "$2",
              color: "$hiContrast !important",
              backgroundColor: "$neutral5 !important",
              boxShadow: "none",
            }}
            size="3"
            id="name"
            type="text"
            value={embedString}
            disabled={true}
          />

          <CopyToClipboard text={embedString} onCopy={onCopy}>
            <Button
              css={{ mt: "$4", alignSelf: "flex-end" }}
              size="2"
              variant="primary">
              Copy Code
            </Button>
          </CopyToClipboard>
        </Flex>
      </DialogContent>
    </Dialog>
  );
};

export default EmbedVideoDialog;
