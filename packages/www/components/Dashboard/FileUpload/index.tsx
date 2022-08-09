import { useMemo } from "react";
import {
  Heading,
  Text,
  Box,
  Flex,
  Link as A,
  IconButton,
  ProgressBar,
} from "@livepeer/design-system";
import { useApi } from "hooks";
import { Cross2Icon } from "@radix-ui/react-icons";

const MAX_FILENAME_LENGTH = 20;

const FileUpload = () => {
  const { currentFileUploads, clearFileUploads } = useApi();

  const fileUploadsFiltered = useMemo(
    () =>
      Object.keys(currentFileUploads ?? {})
        .map((key) => currentFileUploads?.[key])
        .filter((file) => file && !file.error && file.file.name),
    [currentFileUploads]
  );

  const hasPendingFileUploads = useMemo(
    () => fileUploadsFiltered.some((file) => !file.completed),
    [fileUploadsFiltered]
  );

  return fileUploadsFiltered.length === 0 ? (
    <></>
  ) : (
    <Box
      css={{
        position: "fixed",
        bottom: "$4",
        right: "$6",
        p: "$4",
        maxWidth: 450,
        minWidth: 380,
        border: "1px solid $neutral6",
        borderRadius: "$3",
        zIndex: 2,
        backgroundColor: "$panel",
      }}>
      <Flex direction="column" justify="center" css={{}}>
        {!hasPendingFileUploads && (
          <Box css={{ position: "absolute", top: "$3", right: "$2" }}>
            <IconButton
              onClick={() => clearFileUploads()}
              css={{ color: "$whiteA12", cursor: "pointer" }}>
              <Cross2Icon />
            </IconButton>
          </Box>
        )}
        <Heading css={{ fontWeight: 500, mb: "$3" }}>
          {hasPendingFileUploads ? "Upload in progress" : "Upload complete"}
        </Heading>
        {hasPendingFileUploads && (
          <Text variant="gray" css={{ lineHeight: 1.5, mb: "$3" }}>
            Do not close this page until upload is complete.
          </Text>
        )}
        {fileUploadsFiltered.map((file) => (
          <Flex
            key={file?.file?.name ?? ""}
            align="center"
            css={{ width: "100%", justifyContent: "space-between" }}>
            <Text>
              {file?.file?.name?.length > MAX_FILENAME_LENGTH
                ? `${file.file.name.slice(0, MAX_FILENAME_LENGTH)}...`
                : file?.file?.name ?? ""}
            </Text>
            <Flex align="center" css={{ ml: "$3" }}>
              {file?.completed ? (
                <>
                  <Text css={{}} variant="gray">
                    {"100% uploaded"}
                  </Text>
                </>
              ) : (
                <>
                  <Box css={{ mr: "$2", width: 120 }}>
                    <ProgressBar
                      variant="blue"
                      value={(file?.progress ?? 0) * 100}
                    />
                  </Box>
                  <Text css={{ mr: "$2", width: 25 }} variant="gray">
                    {(Number(file?.progress ?? 0) * 100).toFixed(0)}
                    {"%"}
                  </Text>
                </>
              )}
            </Flex>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};

export default FileUpload;
