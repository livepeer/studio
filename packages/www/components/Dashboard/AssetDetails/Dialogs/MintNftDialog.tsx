import { Asset } from "livepeer";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Heading,
} from "@livepeer/design-system";

const MintNftDialog = ({
  isOpen,
  onOpenChange,
  asset,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  asset: Asset;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent css={{ width: 550, px: "$5", py: "$4" }}>
        <DialogTitle asChild>
          <Heading size="1">Mint a Video NFT</Heading>
        </DialogTitle>

        <Box css={{ my: "$5" }}>
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem
          accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae.
        </Box>

        <Button css={{ width: "100%" }} size="4" variant="primary">
          Connect my wallet
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default MintNftDialog;
