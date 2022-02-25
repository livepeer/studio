import {
  Box,
  Button,
  Flex,
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogCancel,
  AlertDialogDescription,
  TextField,
  Heading,
  Text,
  Label,
} from "@livepeer.com/design-system";
import { useState } from "react";
import Spinner from "components/Dashboard/Spinner";

const ImportVideoDialog = ({
  isOpen,
  onOpenChange,
  onCreate,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: (videoName: string, videoUrl: string) => Promise<void>;
}) => {
  const [creating, setCreating] = useState(false);
  const [videoName, setVideoName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle as={Heading} size="2">
          Import video from URL
        </AlertDialogTitle>

        <Box
          css={{ mt: "$3" }}
          as="form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (creating) {
              return;
            }
            setCreating(true);
            try {
              await onCreate(videoName, videoUrl);
            } catch (error) {
              console.error(error);
            } finally {
              setCreating(false);
            }
          }}>
          <AlertDialogDescription
            as={Text}
            size="3"
            variant="gray"
            css={{ mt: "$2", fontSize: "$2", mb: "$4" }}>
            If entering multiple URLs, separate them with a comma.
          </AlertDialogDescription>
          <Flex direction="column" gap="2">
            <Label htmlFor="firstName">URL to import</Label>
            <TextField
              required
              size="2"
              type="text"
              id="firstName"
              autoFocus={true}
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="e.g. https://example.com/video.mp4"
            />
            {/* <Text size="1" css={{ fontWeight: 500, color: "$gray9" }}>
              A-Z, a-z, 0-9, -, _, ~ only
            </Text> */}
          </Flex>
          <Flex direction="column" gap="2">
            <Label htmlFor="firstName">Video name</Label>
            <TextField
              required
              size="2"
              type="text"
              id="firstName"
              autoFocus={true}
              value={videoName}
              onChange={(e) => setVideoName(e.target.value)}
              placeholder="e.g. My First Imported Video"
            />
            {/* <Text size="1" css={{ fontWeight: 500, color: "$gray9" }}>
              A-Z, a-z, 0-9, -, _, ~ only
            </Text> */}
          </Flex>

          <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
            <AlertDialogCancel disabled={creating} size="2" as={Button} ghost>
              Cancel
            </AlertDialogCancel>
            <Button
              css={{ display: "flex", ai: "center" }}
              type="submit"
              size="2"
              disabled={creating}
              variant="violet">
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
              Import Video
            </Button>
          </Flex>
        </Box>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ImportVideoDialog;
