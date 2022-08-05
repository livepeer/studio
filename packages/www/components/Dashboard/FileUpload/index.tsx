import { useMemo } from "react";
import {
  Heading,
  Text,
  Box,
  Flex,
  Link as A,
  Container,
  ProgressBar,
} from "@livepeer/design-system";
import { useApi } from "hooks";

const MAX_FILENAME_LENGTH = 20;

const FileUpload = () => {
  const { currentFileUploads } = useApi();

  const fileUploadsFiltered = useMemo(
    () =>
      Object.keys(currentFileUploads ?? {})
        .map((key) => currentFileUploads?.[key])
        .filter((file) => file && !file.error && file.file.name),
    [currentFileUploads]
  );

  return fileUploadsFiltered.length === 0 ? (
    <></>
  ) : (
    <Box
      css={{
        position: "fixed",
        bottom: "$4",
        right: "$6",
        p: "$5",
        maxWidth: 450,
        border: "1px solid $neutral6",
        borderRadius: "$3",
        zIndex: 2,
      }}>
      <Flex direction="column" justify="center" css={{}}>
        <Heading css={{ fontWeight: 500, mb: "$3" }}>
          Import in progress
        </Heading>
        <Text variant="gray" css={{ lineHeight: 1.5, mb: "$3" }}>
          Do not close this page until upload(s) complete.
        </Text>
        {fileUploadsFiltered.map((file) => (
          <Flex
            align="center"
            css={{ width: "100%", justifyContent: "space-between" }}>
            <Text variant="gray">
              {file.file.name.length > MAX_FILENAME_LENGTH
                ? `${file.file.name.slice(0, MAX_FILENAME_LENGTH)}...`
                : file.file.name}
            </Text>
            <Flex align="center" css={{ ml: "$3" }}>
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
            </Flex>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};

export default FileUpload;
