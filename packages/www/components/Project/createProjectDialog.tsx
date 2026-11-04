import { Box, Flex, Heading, Label } from "@livepeer/design-system";
import Spinner from "components/Spinner";
import { Button } from "components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "components/ui/dialog";
import { Input } from "components/ui/input";
import { useState } from "react";

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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <DialogTitle asChild>
          <Heading size="1">Create Project</Heading>
        </DialogTitle>
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
              setProjectName("");
            }
          }}>
          <Flex direction="column" gap="2">
            <Label htmlFor="projectName">Project name</Label>
            <Input
              required
              type="text"
              id="projectName"
              autoFocus={true}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. My first project"
            />
          </Flex>

          <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
            <DialogClose asChild>
              <Button disabled={creating} variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              css={{ display: "flex", ai: "center" }}
              type="submit"
              disabled={creating}>
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
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
