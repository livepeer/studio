import {
  Box,
  Button,
  Flex,
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogAction,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  TextField,
  Text,
  Heading,
  styled,
} from "@livepeer.com/design-system";
import { useState } from "react";
import { useApi } from "../../../hooks";
import { PlusIcon } from "@radix-ui/react-icons";
import Spinner from "@components/Dashboard/Spinner";

const StyledPlusIcon = styled(PlusIcon, {
  mr: "$1",
});

const Create = ({ newToken, setNewToken }) => {
  const [creating, setCreating] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const { getApiTokens, createApiToken } = useApi();

  return (
    <AlertDialog>
      <AlertDialogTrigger
        as={Button}
        variant="violet"
        size="2"
        css={{ display: "flex", alignItems: "center" }}>
        <StyledPlusIcon /> Create key
      </AlertDialogTrigger>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle as={Heading} size="1">
          Create key
        </AlertDialogTitle>
        <Box
          as="form"
          onSubmit={(e) => {
            e.preventDefault();
            if (creating) {
              return;
            }
            setCreating(true);
            createApiToken({ name: tokenName })
              .then((newToken) => {
                setNewToken(newToken);
                setCreating(false);
              })
              .catch(() => {
                setCreating(false);
              });
          }}>
          <AlertDialogDescription
            as={Text}
            size="3"
            variant="gray"
            css={{ mt: "$2", lineHeight: "22px", mb: "$2" }}>
            Enter a name for your key to differentiate it from other keys.
          </AlertDialogDescription>

          <Flex direction="column" gap="2">
            <TextField
              size="2"
              type="text"
              id="tokenName"
              autoFocus={true}
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="e.g. New key"
            />
          </Flex>
        </Box>
        <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
          <AlertDialogCancel size="2" as={Button} ghost>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            as={Button}
            size="2"
            disabled={creating}
            type="submit"
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
            Create
          </AlertDialogAction>
        </Flex>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default Create;
