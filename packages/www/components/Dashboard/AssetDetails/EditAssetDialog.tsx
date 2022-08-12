import { HttpError } from "@lib/utils";
import { Asset } from "@livepeer.studio/api";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  Label,
  Text,
  TextArea,
  TextField,
} from "@livepeer/design-system";
import Spinner from "components/Dashboard/Spinner";
import { useEffect, useMemo, useState } from "react";

const demoIpfsContent = {
  name: "Singularity in Heritage - Chapter III #095",
  tokenID: 316,
  image: "ipfs://QmUrkCHzXHFE2DVucEcarXSe7po39mcKereN1wd9k6gQfw/316.jpg",
} as const;

export type EditAssetReturnValue = {
  name: string;
  metadata: Record<string, unknown> | null;
};

const EditAssetDialog = ({
  isOpen,
  onOpenChange,
  onEdit,
  asset,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEdit: (v: EditAssetReturnValue) => Promise<void>;
  asset: Asset;
}) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [metadata, setMetadata] = useState("");
  const [metadataError, setMetadataError] = useState("");

  useEffect(() => {
    setName(asset?.name);
    if (asset?.meta) {
      setMetadata(JSON.stringify(asset?.meta ?? {}, null, 4));
    }
  }, [asset]);

  const isMetadataValid = useMemo(() => {
    if (!metadata) {
      return true;
    }

    try {
      const value = JSON.parse(metadata);
      return Boolean(value);
    } catch (e) {}

    return false;
  }, [metadata]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent
        css={{
          maxWidth: 450,
          minWidth: 350,
          px: "$5",
          pt: "$4",
          pb: "$4",
          zIndex: 5,
        }}>
        <AlertDialogTitle asChild>
          <Heading size="1">Edit Asset</Heading>
        </AlertDialogTitle>

        <Box
          css={{ mt: "$3" }}
          as="form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (editing || !name) {
              return;
            }
            setMetadataError("");
            setEditing(true);
            try {
              await onEdit({
                name,
                metadata: metadata ? JSON.parse(metadata) : null,
              });
              onOpenChange(false);
            } catch (error) {
              console.error(error);
              if (
                (error as HttpError)?.status === 422 &&
                (error as HttpError)?.message?.includes("should be string")
              ) {
                setMetadataError(
                  "Metadata must only contain string key value pairs."
                );
              }
            } finally {
              setEditing(false);
            }
          }}>
          <Flex css={{ mt: "$2" }} direction="column" gap="1">
            <Label htmlFor="name">Display Name</Label>
            <TextField
              size="2"
              id="name"
              type="text"
              autoFocus={true}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Display name for the VOD asset"
            />
          </Flex>

          <Flex css={{ mt: "$2" }} direction="column" gap="1">
            <Label htmlFor="metadata">Metadata</Label>
            <TextArea
              size="2"
              id="metadata"
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
              placeholder={JSON.stringify(demoIpfsContent, null, 4)}
            />
          </Flex>
          {(metadataError || !isMetadataValid) && (
            <AlertDialogDescription asChild>
              <Text
                size="3"
                variant="red"
                css={{ mt: "$2", fontSize: "$2", mb: "$4" }}>
                {metadataError || "Metadata must be valid JSON."}
              </Text>
            </AlertDialogDescription>
          )}

          <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
            <AlertDialogCancel asChild>
              <Button disabled={editing} size="2" ghost>
                Cancel
              </Button>
            </AlertDialogCancel>
            <Button
              css={{ display: "flex", ai: "center" }}
              type="submit"
              size="2"
              disabled={editing || !isMetadataValid || !name}
              variant="primary">
              {editing && (
                <Spinner
                  css={{
                    color: "$hiContrast",
                    width: 16,
                    height: 16,
                    mr: "$2",
                  }}
                />
              )}
              Save
            </Button>
          </Flex>
        </Box>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EditAssetDialog;
