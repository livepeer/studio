import {
  Button,
  Flex,
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogCancel,
  Heading,
  Text,
} from "@livepeer/design-system";

const ErrorDialog = ({
  description,
  isOpen,
  onOpenChange,
}: {
  description: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent css={{ maxWidth: 450, px: "$5", pt: "$4", pb: "$4" }}>
        <AlertDialogTitle asChild>
          <Heading size="1">Error</Heading>
        </AlertDialogTitle>
        <AlertDialogDescription asChild>
          <Text size="3" variant="gray" css={{ mt: "$2", lineHeight: "22px" }}>
            {description}
          </Text>
        </AlertDialogDescription>

        <Flex css={{ jc: "flex-end", gap: "$3", mt: "$5" }}>
          <AlertDialogCancel asChild>
            <Button size="2" ghost>
              Ok
            </Button>
          </AlertDialogCancel>
        </Flex>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ErrorDialog;
