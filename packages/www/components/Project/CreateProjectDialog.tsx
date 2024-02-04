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
} from "@livepeer/design-system";

const CreateProjectDialog = ({
  isOpen,
  onOpenChange,
  onCreate,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreate: (projectName: string) => Promise<void>;
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent
        css={{
          maxWidth: 450,
          px: "$5",
          pt: "$4",
          pb: "$4",
          backgroundColor: "white",
        }}>
        <AlertDialogTitle asChild>
          <Heading size="1">Create project</Heading>
        </AlertDialogTitle>
        <Box
          css={{ mt: "$3" }}
          as="form"
          onSubmit={async (e) => {
            //  Handle create project
          }}>
          <AlertDialogDescription asChild>
            <Text
              size="3"
              variant="neutral"
              css={{ mt: "$2", fontSize: "$3", mb: "$4" }}>
              Working with different projects helps create a clear separation
              between different customers or working environments.
            </Text>
          </AlertDialogDescription>
          <Flex direction="column" gap="2">
            <TextField
              required
              size="2"
              type="text"
              id="firstName"
              autoFocus={true}
              placeholder="Project name"
            />
          </Flex>
          <Flex css={{ jc: "flex-end", gap: "$3", mt: "$4" }}>
            <AlertDialogCancel asChild>
              <Button
                css={{
                  p: "$4",
                  fontSize: "$2",
                  backgroundColor: "$neutral4",
                  color: "black",
                }}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <Button
              css={{
                p: "$4",
                fontSize: "$2",
                backgroundColor: "black",
                color: "white",
              }}
              type="submit"
              size="2"
              variant="primary">
              Create new project
            </Button>
          </Flex>
        </Box>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateProjectDialog;
