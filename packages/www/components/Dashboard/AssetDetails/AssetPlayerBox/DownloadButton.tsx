import { Button, Box, Link } from "@livepeer/design-system";
import { DownloadIcon } from "@radix-ui/react-icons";

const DownloadButton = ({ downloadUrl }: { downloadUrl?: string }) => {
  if (!downloadUrl) {
    return null;
  }
  return (
    <Link
      css={{
        textDecorationColor: "transparent",
        "&:hover": {
          textDecorationColor: "transparent",
        },
      }}
      target="_blank"
      href={downloadUrl}>
      <Button size="2" ghost css={{ mr: "$1" }}>
        <Box as={DownloadIcon} css={{ mr: "$1" }} />
        Download
      </Button>
    </Link>
  );
};

export default DownloadButton;
