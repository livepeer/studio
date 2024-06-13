import {
  Box,
  Button,
  Flex,
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  Overlay,
  Heading,
  Text,
  DropdownMenuItem,
  Portal,
  Alert,
  Label,
  TextField,
} from "@livepeer/design-system";
import { useState } from "react";
import { useApi } from "../../hooks";
import Spinner from "components/Spinner";
import Router from "next/router";
import { Project } from "@livepeer.studio/api";

const DeleteProjectDialog = ({
  project,
  invalidate,
  open,
  onOpenChange,
  ...props
}: {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invalidate: () => void;
}) => {
  const { deleteProject } = useApi();
  const [saving, setSaving] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange} {...props}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle asChild>
          <Heading size="1">Delete Project </Heading>
        </AlertDialogTitle>
        <AlertDialogDescription asChild>
          <Text
            size="3"
            variant="neutral"
            css={{ mt: "$2", lineHeight: "22px" }}>
            This project will be deleted, along with all of its Assets, Streams,
            Webhooks, API Keys, and Signing Keys.
          </Text>
        </AlertDialogDescription>

        <Alert variant="red" css={{ mt: "$2", fontSize: "$1" }}>
          Warning: This action is not reversible. Please be certain.
        </Alert>

        <Flex css={{ jc: "flex-end", gap: "$3", mt: "$5" }}>
          <AlertDialogCancel asChild>
            <Button size="2" onClick={() => onOpenChange(false)} ghost>
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              size="2"
              disabled={saving}
              onClick={async (e) => {
                try {
                  e.preventDefault();
                  setSaving(true);
                  await deleteProject(project.id);
                  Router.replace("/dashboard");
                  await invalidate();
                  setSaving(false);
                } catch (e) {
                  setSaving(false);
                }
              }}
              variant="red">
              {saving && (
                <Spinner
                  css={{
                    color: "$hiContrast",
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

export default DeleteProjectDialog;
