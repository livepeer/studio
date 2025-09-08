import { Box, ProgressBar, Text } from "@livepeer/design-system";
import { CheckIcon } from "@radix-ui/react-icons";
import { FileUpload } from "hooks/use-api/types";
import Item from "./Item";

const MAX_FILENAME_LENGTH = 20;

const FileItem = ({ fileUpload }: { fileUpload: FileUpload }) => {
  const { file, completed, progress } = fileUpload;
  const { name } = file;

  const mainChildren = (
    <Text>
      {name?.length > MAX_FILENAME_LENGTH
        ? `${name.slice(0, MAX_FILENAME_LENGTH)}...`
        : (name ?? "")}
    </Text>
  );

  const secondaryChildren = completed ? (
    <Text size="2" variant="neutral">
      {"100% uploaded"}
    </Text>
  ) : (
    <ProgressBar
      placeholder="Progress bar"
      variant="gray"
      value={(progress ?? 0) * 100}
    />
  );

  const accessoryChildren = completed ? (
    <Box as={CheckIcon} css={{ align: "right", color: "$green9" }} />
  ) : (
    <Text size="2" css={{ mr: "$2", width: 25 }} variant="neutral">
      {(Number(progress ?? 0) * 99).toFixed(0)}
      {"%"}
    </Text>
  );

  return (
    <Item
      mainChildren={mainChildren}
      secondaryChildren={secondaryChildren}
      accessoryChildren={accessoryChildren}
    />
  );
};

export default FileItem;
