import { Asset } from "livepeer";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  Box,
  Button,
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
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent
        css={{
          width: 550,
          px: "$5",
          pt: "$4",
          pb: "$4",
        }}>
        <AlertDialogTitle asChild>
          <Heading size="1">Mint a Video NFT</Heading>
        </AlertDialogTitle>

        <Box css={{ my: "$5" }}>
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem
          accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae.
        </Box>

        <Button css={{ width: "100%" }} size="4" variant="primary">
          Connect my wallet
        </Button>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default MintNftDialog;
