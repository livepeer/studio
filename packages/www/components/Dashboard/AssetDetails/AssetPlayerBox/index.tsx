import { Asset } from "livepeer";
import { Box, Flex } from "@livepeer/design-system";
import AssetStatusBox from "./AssetStatusBox";
import DownloadButton from "./DownloadButton";
import MintNftButton from "./MintNftButton";
import ShareButton from "./ShareButton";

const AssetPlayerBox = ({
  asset,
  onEmbedVideoClick,
  onMintNftClick,
}: {
  asset?: Asset;
  onEmbedVideoClick: () => void;
  onMintNftClick: () => void;
}) => {
  if (!asset) {
    return null;
  }
  return (
    <Box
      css={{
        maxWidth: "470px",
        justifySelf: "flex-end",
        width: "100%",
      }}>
      <Box
        css={{
          borderRadius: "$3",
          overflow: "hidden",
          position: "relative",
          mb: "$2",
        }}>
        <AssetStatusBox asset={asset} />
      </Box>
      <Box
        css={{
          mb: "$5",
        }}>
        <Flex align="center">
          <DownloadButton downloadUrl={asset.downloadUrl} />
          <ShareButton
            playbackId={asset.playbackId}
            onEmbedVideoClick={onEmbedVideoClick}
          />
          <MintNftButton onClick={onMintNftClick} />
        </Flex>
      </Box>
    </Box>
  );
};

export default AssetPlayerBox;
