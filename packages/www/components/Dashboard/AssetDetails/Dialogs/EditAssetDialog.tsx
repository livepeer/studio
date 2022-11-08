import { Asset } from "livepeer";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTitle,
  Box,
  Button,
  Flex,
  Heading,
  Label,
  TextField,
} from "@livepeer/design-system";
import Spinner from "components/Dashboard/Spinner";
import { useEffect, useState } from "react";

export type EditAssetReturnValue = {
  name: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    setName(asset?.name);
  }, [asset]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || !name) {
      return;
    }
    setIsLoading(true);
    try {
      await onEdit({ name });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent
        css={{
          maxWidth: 450,
          minWidth: 350,
          px: "$5",
          pt: "$4",
          pb: "$4",
        }}>
        <AlertDialogTitle asChild>
          <Heading size="1">Edit Asset</Heading>
        </AlertDialogTitle>

        <Box css={{ mt: "$3" }} as="form" onSubmit={onSubmit}>
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
              disabled={isLoading}
            />
          </Flex>

          <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
            <AlertDialogCancel asChild>
              <Button disabled={isLoading} size="2" ghost>
                Cancel
              </Button>
            </AlertDialogCancel>
            <Button
              css={{ display: "flex", ai: "center" }}
              type="submit"
              size="2"
              disabled={isLoading || !name}
              variant="primary">
              {isLoading && (
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
