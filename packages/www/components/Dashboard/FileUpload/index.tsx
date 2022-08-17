import {
  Box,
  Flex,
  Heading,
  IconButton,
  ProgressBar,
  Text,
} from "@livepeer/design-system";
import {
  CheckIcon,
  Cross2Icon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import { useApi } from "hooks";
import { useEffect, useMemo } from "react";

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

  useEffect(() => {
    // if there are currently file uploads pending, show a warning when the user tries to close the tab
    if (typeof window !== "undefined" && hasPendingFileUploads) {
      const alertUser = (ev: BeforeUnloadEvent) => {
        ev.preventDefault();
        return (ev.returnValue = "Are you sure you want to close?");
      };
      window.addEventListener("beforeunload", alertUser);

      return () => {
        window.removeEventListener("beforeunload", alertUser);
      };
    }
  }, [typeof window, hasPendingFileUploads]);

  return fileUploadsFiltered.length === 0 ? (
    <></>
  ) : (
    <Box
      css={{
        position: "fixed",
        bottom: "$4",
        right: "$6",
        p: "$4",
        maxWidth: 550,
        minWidth: 420,
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
              css={{ cursor: "pointer" }}>
              <Cross2Icon />
            </IconButton>
          </Box>
        )}
        <Heading css={{ fontWeight: 500, mb: "$3" }}>
          {hasPendingFileUploads ? "Upload in progress" : "Upload complete"}
        </Heading>
        {hasPendingFileUploads && (
          <Box
            css={{
              borderRadius: "$3",
              backgroundColor: "$yellow3",
              mb: "$2",
              p: "$2",
            }}>
            <Flex align="center">
              <Box css={{ color: "$yellow11" }} as={ExclamationTriangleIcon} />
              <Text css={{ fontWeight: 600, color: "$yellow11", ml: "$2" }}>
                Do not close this page until upload is complete.
              </Text>
            </Flex>
          </Box>
        )}
        {fileUploadsFiltered.map((file) => (
          <Flex
            key={file?.file?.name ?? ""}
            align="center"
            css={{
              my: "$1",
              width: "100%",
              justifyContent: "space-between",
            }}>
            <Text>
              {file?.file?.name?.length > MAX_FILENAME_LENGTH
                ? `${file.file.name.slice(0, MAX_FILENAME_LENGTH)}...`
                : file?.file?.name ?? ""}
            </Text>
            <Flex align="center" css={{ ml: "$3" }}>
              <Box css={{ mr: "$2", width: 120 }}>
                {file?.completed ? (
                  <Text size="2" css={{}} variant="gray">
                    {"100% uploaded"}
                  </Text>
                ) : (
                  <ProgressBar
                    variant="blue"
                    value={(file?.progress ?? 0) * 100}
                  />
                )}
              </Box>
              {file?.completed ? (
                <Box
                  as={CheckIcon}
                  css={{ align: "right", color: "$green9" }}
                />
              ) : (
                <Text size="2" css={{ mr: "$2", width: 25 }} variant="gray">
                  {(Number(file?.progress ?? 0) * 100).toFixed(0)}
                  {"%"}
                </Text>
              )}
            </Flex>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
};

export default FileUpload;
