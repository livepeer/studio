import { Button, Box } from "@livepeer/design-system";
import { CubeIcon } from "@radix-ui/react-icons";

const MintNftButton = ({ onClick }: { onClick(): void }) => (
  <Button size="2" ghost css={{ mr: "$1" }} onClick={onClick}>
    <Box as={CubeIcon} css={{ mr: "$1" }} />
    Mint
  </Button>
);

export default MintNftButton;
