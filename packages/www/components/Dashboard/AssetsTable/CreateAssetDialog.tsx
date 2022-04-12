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

const CreateAssetDialog = ({
  isOpen,
  onOpenChange,
  onCreate,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: ({ name, url }: { name: string; url: string }) => Promise<void>;
}) => {
  const [creating, setCreating] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [assetUrl, setAssetUrl] = useState("");

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle as={Heading} size="1">
          Create a new asset
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
              await onCreate({ name: assetName, url: assetUrl });
            } catch (error) {
              console.error(error);
            } finally {
              setCreating(false);
            }
          }}>
          <Flex direction="column" gap="2">
            <Label htmlFor="assetName">Asset name</Label>
            <TextField
              required
              size="2"
              type="text"
              id="assetName"
              autoFocus={true}
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="e.g. My video asset"
            />
          </Flex>
          <AlertDialogDescription
            as={Text}
            size="3"
            variant="gray"
            css={{ mt: "$1", fontSize: "$2", mb: "$4" }}>
            The name of the `Asset` containing a custom human-readable title.
          </AlertDialogDescription>
          <Flex direction="column" gap="2">
            <Label htmlFor="ingestUrl">Asset URL</Label>
            <TextField
              required
              autoFocus
              size="2"
              type="url"
              pattern="^(http|https?)://.+"
              id="assetUrl"
              value={assetUrl}
              onChange={(e) => setAssetUrl(e.target.value)}
              placeholder="e.g. https://example.com/play.mp4"
            />
          </Flex>
          <AlertDialogDescription
            as={Text}
            size="3"
            variant="gray"
            css={{ mt: "$1", fontSize: "$2", mb: "$4" }}>
            The URL of the file that Livepeer should download and use.
          </AlertDialogDescription>

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
              Create Asset
            </Button>
          </Flex>
        </Box>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateAssetDialog;
