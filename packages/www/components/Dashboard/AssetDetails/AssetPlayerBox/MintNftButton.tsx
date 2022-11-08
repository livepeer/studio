import { Button, Box } from "@livepeer/design-system";
import { DownloadIcon } from "@radix-ui/react-icons";

const MintNftButton = ({ onClick }: { onClick(): void }) => (
  <Button size="2" ghost css={{ mr: "$1" }} onClick={onClick}>
    <Box as={DownloadIcon} css={{ mr: "$1" }} />
    Mint
  </Button>
);

export default MintNftButton;
