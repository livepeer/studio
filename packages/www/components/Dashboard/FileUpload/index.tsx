import { Box, Flex, Heading, IconButton, Text } from "@livepeer/design-system";
import { Cross2Icon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useApi } from "hooks";
import { useEffect, useMemo, useState } from "react";
import AssetFailedStatusItem from "./AssetFailedStatusItem";
import FileItem from "./FileItem";
import { FileUploadFilteredItem, filteredItemsToShow } from "./helpers";

const FileUpload = () => {
  const { currentFileUploads, clearFileUploads, getAssets, user } = useApi();
  const [items, setItems] = useState<FileUploadFilteredItem[]>([]);

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

  useEffect(() => {
    (async () => {
      if (!user) return;
      const [assets] = await getAssets(user.id, { limit: 20 });
      const filteredItems = filteredItemsToShow(fileUploadsFiltered, assets); // TODO: deal with id?
      setItems(filteredItems);
    })();
  }, [user, fileUploadsFiltered]);

  if (!items.length) {
    return <></>;
  }

  return (
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

        {items.map((item) => {
          switch (item.type) {
            case "file":
              return <FileItem fileUpload={item.file} />;
            case "asset":
              return <AssetFailedStatusItem asset={item.asset} />;
            default:
              return <></>;
          }
        })}
      </Flex>
    </Box>
  );
};

export default FileUpload;
