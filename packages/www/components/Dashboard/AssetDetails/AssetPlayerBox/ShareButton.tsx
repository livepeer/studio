import { Button, Box } from "@livepeer/design-system";
import { Share2Icon } from "@radix-ui/react-icons";
import AssetSharePopup from "../Dialogs/AssetSharePopup";

const ShareButton = ({
  playbackId,
  onEmbedVideoClick,
}: {
  playbackId?: string;
  onEmbedVideoClick(): void;
}) => {
  if (!playbackId) {
    return null;
  }
  return (
    <AssetSharePopup
      playbackId={playbackId}
      triggerNode={
        <Button size="2" ghost>
          <Box
            as={Share2Icon}
            css={{
              mr: "$1",
            }}
          />
          Share
        </Button>
      }
      onEmbedVideoClick={onEmbedVideoClick}
    />
  );
};

export default ShareButton;
