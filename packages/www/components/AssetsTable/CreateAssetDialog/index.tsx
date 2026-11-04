import { Box, IconButton, Heading } from "@livepeer/design-system";
import { useCallback, useMemo, useState } from "react";
import Spinner from "components/Spinner";
import { useDropzone } from "react-dropzone";
import { Cross2Icon } from "@radix-ui/react-icons";
import omit from "lodash.omit";
import { isStaging } from "lib/utils";
import AssetsUploadError from "./AssetsUploadError";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogClose,
} from "components/ui/dialog";
import { Button } from "components/ui/button";
import { Text } from "components/ui/text";
import { Flex } from "components/ui/flex";

// Note: commond mimetype list https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
const acceptedMimeTypes = isStaging()
  ? { "*": [] }
  : {
      "video/mp4": [".mp4"],
      "video/quicktime": [".mov"],
      "video/x-msvideo": [".avi"],
      "video/webm": [".webm"],
      "video/x-ms-wmv": [".wmv"],
      "video/x-matroska": [".mkv"],
      "video/x-flv": [".flv"],
    };

const acceptedFileTypesString = Object.keys(acceptedMimeTypes)
  .flatMap((key) => acceptedMimeTypes[key])
  .join(", ");

const maxFiles = 100;

const activeStyle = {
  borderColor: "white",
};

const acceptStyle = {
  borderColor: "#5842c3",
};

const rejectStyle = {
  borderColor: "red",
};

type VideoFiles = {
  [key: string]: File;
};

const CreateAssetDialog = ({
  isOpen,
  onOpenChange,
  onCreate,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: ({ videoFiles }: { videoFiles: File[] }) => Promise<void>;
}) => {
  const [creating, setCreating] = useState(false);
  const [videoFiles, setVideoFiles] = useState<VideoFiles>({});

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles || !acceptedFiles.length) return;

    setVideoFiles((prev) => {
      const newVideoFiles = {
        ...prev,
        ...acceptedFiles.reduce(
          (prev, curr) => ({ ...prev, [curr.name]: curr }),
          {},
        ),
      };
      // Make sure there are never more than the max allowed files selected
      return Object.keys(newVideoFiles).length <= maxFiles
        ? newVideoFiles
        : prev;
    });
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    fileRejections,
  } = useDropzone({
    accept: acceptedMimeTypes,
    maxFiles,
    onDrop,
  });

  const style = useMemo(
    () => ({
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
      ...(isDragActive ? activeStyle : {}),
    }),
    [isDragActive, isDragReject, isDragAccept],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>
          <Heading size="1">Upload Asset</Heading>
        </DialogTitle>

        <Box
          css={{ mt: "$3" }}
          as="form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (creating || !videoFiles) {
              return;
            }
            setCreating(true);
            try {
              await onCreate({
                videoFiles: Object.keys(videoFiles).map(
                  (key) => videoFiles[key],
                ),
              });
              setVideoFiles({});
            } catch (error) {
              console.error(error);
            } finally {
              setCreating(false);
            }
          }}>
          <Box
            css={{
              mb: "$3",
              width: "100%",
            }}>
            <Box
              css={{
                width: "100%",

                p: "$1",
                mb: "$0",
                height: "auto",
                border: "1px solid hsl(var(--primary))",
                borderRadius: "$1",
              }}
              {...getRootProps({ style })}>
              <Box as="input" {...getInputProps()} />
              <Box
                as="p"
                css={{
                  width: "100%",
                  height: "100%",
                  border: "1px dotted hsl(var(--primary))",
                  borderRadius: "$1",
                  m: 0,
                  fontSize: "$3",
                  p: "$3",
                  transition: "border .24s ease-in-out",
                  minWidth: "296px",
                  minHeight: "70px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}>
                <Text>
                  Drag and drop or{" "}
                  <span className="font-semibold">browse files</span>
                </Text>
              </Box>
            </Box>

            <AssetsUploadError fileRejections={fileRejections} />

            <Box css={{ mt: "$1" }}>
              {videoFiles &&
                Object.keys(videoFiles).map((key) => (
                  <Flex className="items-center gap-1" key={key}>
                    <IconButton
                      onClick={() => setVideoFiles((prev) => omit(prev, key))}>
                      <Cross2Icon />
                    </IconButton>
                    <Text size="sm">{key}</Text>
                  </Flex>
                ))}
            </Box>
          </Box>
          <DialogDescription>
            <Text size="sm" variant="neutral" className="mt-1">
              Select up to {maxFiles} files. Files are uploaded 5 at a time.
              <br />
              {acceptedFileTypesString} supported.
            </Text>
          </DialogDescription>
          <Flex className="justify-end gap-3 mt-4">
            <DialogClose>
              <Button disabled={creating} variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={creating || Object.keys(videoFiles ?? {}).length === 0}
              variant="default">
              {creating && (
                <Spinner
                  css={{
                    color: "$hiContrast",
                    width: 16,
                    height: 16,
                    mr: "$2",
                  }}
                />
              )}
              Upload
            </Button>
          </Flex>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAssetDialog;
