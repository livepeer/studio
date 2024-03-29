import {
  Box,
  Button,
  Flex,
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogCancel,
  TextField,
  Heading,
  Label,
} from "@livepeer/design-system";
import { useCallback, useState } from "react";
import Spinner from "components/Spinner";
import { createProject } from "hooks/use-api/endpoints/project";

const CreateProjectDialog = ({
  isOpen,
  onOpenChange,
  onCreate,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: (projectName: string) => Promise<void>;
}) => {
  const [creating, setCreating] = useState(false);
  const [projectName, setProjectName] = useState("");

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle asChild>
          <Heading size="1">Create Project</Heading>
        </AlertDialogTitle>
        <Label css={{ mt: "$1", color: "$neutral10" }}>
          Working with different projects helps create a clear separation
          between different customers or environments.
        </Label>
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
              await onCreate(projectName);
            } catch (error) {
              console.error(error);
            } finally {
              setCreating(false);
            }
          }}>
          <Flex direction="column" gap="2">
            <Label htmlFor="projectName">Project name</Label>
            <TextField
              required
              size="2"
              type="text"
              css={{
                mt: "-$1",
              }}
              id="projectName"
              autoFocus={true}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. My first project"
            />
          </Flex>

          <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
            <AlertDialogCancel asChild>
              <Button disabled={creating} size="2" ghost>
                Cancel
              </Button>
            </AlertDialogCancel>
            <Button
              css={{ display: "flex", ai: "center" }}
              type="submit"
              size="2"
              disabled={creating}
              variant="primary">
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
              Create new project
            </Button>
          </Flex>
        </Box>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateProjectDialog;
