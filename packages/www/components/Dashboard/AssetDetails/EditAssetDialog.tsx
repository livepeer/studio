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
  Flex,
  Heading,
  Label,
  Text,
  TextArea,
  TextField,
} from "@livepeer/design-system";
import Spinner from "components/Dashboard/Spinner";
import { useEffect, useMemo, useState } from "react";

const demoTags = {
  rating: "E",
  category: "abstract",
  languages: "english",
} as const;

export type EditAssetReturnValue = {
  name: string;
  tags?: Record<string, string>;
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
  const [tags, setTags] = useState("");
  const [tagsError, setTagsError] = useState("");

  useEffect(() => {
    setName(asset?.name);
    if (asset?.tags) {
      setTags(JSON.stringify(asset?.tags ?? {}, null, 4));
    }
  }, [asset]);

  const areTagsValid = useMemo(() => {
    if (!tags) {
      return true;
    }

    try {
      const value = JSON.parse(tags);
      return Boolean(value);
    } catch (e) {}

    return false;
  }, [tags]);

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
            setTagsError("");
            setEditing(true);
            try {
              await onEdit({
                name,
                tags: tags ? JSON.parse(tags) : null,
              });
              onOpenChange(false);
            } catch (error) {
              console.error(error);
              if (
                (error as HttpError)?.status === 422 &&
                (error as HttpError)?.message?.includes("should be string")
              ) {
                setTagsError("Tags must only contain string key value pairs.");
              } else {
                setTagsError("Error updating asset.");
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
            <Label htmlFor="tags">Tags</Label>
            <TextArea
              size="2"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={JSON.stringify(demoTags, null, 4)}
            />
          </Flex>
          {(tagsError || !areTagsValid) && (
            <AlertDialogDescription asChild>
              <Text
                size="3"
                variant="red"
                css={{ mt: "$2", fontSize: "$2", mb: "$4" }}>
                {tagsError || "Tags must be valid JSON."}
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
              disabled={editing || !areTagsValid || !name}
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
