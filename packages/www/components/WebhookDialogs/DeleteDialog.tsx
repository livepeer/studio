import {
  Text,
  AlertDialog,
  Button,
  AlertDialogContent,
  AlertDialogTitle,
  Heading,
  AlertDialogDescription,
  Flex,
  AlertDialogAction,
} from "@livepeer/design-system";
import router from "next/router";
import Spinner from "../Spinner";
import { useProjectContext } from "context/ProjectContext";

const DeleteDialog = ({
  deleteDialogOpen,
  setDeleteDialogOpen,
  deleting,
  setDeleting,
  deleteWebhook,
  invalidateQuery,
}: {
  deleteDialogOpen: boolean;
  setDeleteDialogOpen(boolean): void;
  deleting: boolean;
  setDeleting(boolean): void;
  deleteWebhook(): Promise<void>;
  invalidateQuery(): Promise<void>;
}) => {
  const { appendProjectId } = useProjectContext();

  const onDeleteClick = async () => {
    setDeleting(true);
    await deleteWebhook();
    await invalidateQuery();
    setDeleting(false);
    setDeleteDialogOpen(false);
    router.push(appendProjectId("/developers/webhooks"));
  };

  return (
    <AlertDialog open={deleteDialogOpen}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle asChild>
          <Heading size="1">Delete Webhook</Heading>
        </AlertDialogTitle>
        <AlertDialogDescription asChild>
          <Text
            size="3"
            variant="neutral"
            css={{ mt: "$2", lineHeight: "22px" }}>
            Are you sure you want to delete this webhook?
          </Text>
        </AlertDialogDescription>
        <Flex css={{ jc: "flex-end", gap: "$2", mt: "$5" }}>
          <Button onClick={() => setDeleteDialogOpen(false)} size="2" ghost>
            Cancel
          </Button>
          <AlertDialogAction asChild>
            <Button
              size="2"
              disabled={deleting}
              onClick={onDeleteClick}
              variant="red">
              {deleting && (
                <Spinner
                  css={{
                    width: 16,
                    height: 16,
                    mr: "$2",
                  }}
                />
              )}
              Delete
            </Button>
          </AlertDialogAction>
        </Flex>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteDialog;
