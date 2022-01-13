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
} from "@livepeer.com/design-system";

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
        <AlertDialogTitle as={Heading} size="1">
          Error
        </AlertDialogTitle>
        <AlertDialogDescription
          as={Text}
          size="3"
          variant="gray"
          css={{ mt: "$2", lineHeight: "22px" }}>
          {description}
        </AlertDialogDescription>

        <Flex css={{ jc: "flex-end", gap: "$3", mt: "$5" }}>
          <AlertDialogCancel size="2" as={Button} ghost>
            Ok
          </AlertDialogCancel>
        </Flex>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ErrorDialog;
