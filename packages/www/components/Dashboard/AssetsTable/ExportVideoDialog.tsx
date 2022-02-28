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

const ExportVideoDialog = ({
  isOpen,
  onOpenChange,
  onCreate,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: (
    pinataJwt: string,
    pinataApiKey: string,
    pinataApiSecret: string
  ) => Promise<void>;
}) => {
  const [creating, setCreating] = useState(false);
  const [pinataJwt, setPinataJwt] = useState("");
  const [pinataApiKey, setPinataApiKey] = useState("");
  const [pinataApiSecret, setPinataApiSecret] = useState("");

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle as={Heading} size="2">
          Export your asset to IPFS
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
              await onCreate(pinataJwt, pinataApiKey, pinataApiSecret);
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
            Custom credentials for the Piñata service. Must have either a JWT or
            an API key and an API secret.
          </AlertDialogDescription>
          <Flex direction="column" gap="2">
            <Label htmlFor="firstName">JWT</Label>
            <TextField
              required
              size="2"
              type="text"
              id="firstName"
              autoFocus={true}
              value={pinataJwt}
              onChange={(e) => setPinataJwt(e.target.value)}
              placeholder="JWT"
            />
            {/* <Text size="1" css={{ fontWeight: 500, color: "$gray9" }}>
              A-Z, a-z, 0-9, -, _, ~ only
            </Text> */}
          </Flex>
          <AlertDialogDescription
            as={Text}
            size="3"
            variant="gray"
            css={{ mt: "$2", fontSize: "$2", mb: "$4" }}>
            or
          </AlertDialogDescription>
          <Flex direction="column" gap="2">
            <Label htmlFor="firstName">Api Key</Label>
            <TextField
              required
              size="2"
              type="text"
              id="firstName"
              autoFocus={true}
              value={pinataApiKey}
              onChange={(e) => setPinataApiKey(e.target.value)}
              placeholder="Api Key"
            />
            {/* <Text size="1" css={{ fontWeight: 500, color: "$gray9" }}>
              A-Z, a-z, 0-9, -, _, ~ only
            </Text> */}
          </Flex>
          <Flex direction="column" gap="2">
            <Label htmlFor="firstName">Api Secret</Label>
            <TextField
              required
              size="2"
              type="password"
              id="firstName"
              autoFocus={true}
              value={pinataApiSecret}
              onChange={(e) => setPinataApiSecret(e.target.value)}
              placeholder="Api Secret"
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
              Export
            </Button>
          </Flex>
        </Box>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ExportVideoDialog;
