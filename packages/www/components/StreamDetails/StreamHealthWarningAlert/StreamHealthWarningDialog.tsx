import {
  Box,
  Button,
  Flex,
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogCancel,
  AlertDialogDescription,
  Heading,
  Text,
} from "@livepeer/design-system";

export type StreamHealthWarningDialogProps = {
  issue: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const StreamHealthWarningDialog = ({
  issue,
  isOpen,
  onOpenChange,
}: StreamHealthWarningDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle asChild>
          <Heading size="1">Unhealthy ingest</Heading>
        </AlertDialogTitle>
        <AlertDialogDescription asChild>
          <Text
            size="3"
            variant="neutral"
            css={{ mt: "$2", lineHeight: "22px" }}>
            {issue}
          </Text>
        </AlertDialogDescription>
        <Flex css={{ jc: "flex-end", gap: "$3", mt: "$5" }}>
          <AlertDialogCancel asChild>
            <Button size="2" ghost>
              Dismiss
            </Button>
          </AlertDialogCancel>
        </Flex>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default StreamHealthWarningDialog;
