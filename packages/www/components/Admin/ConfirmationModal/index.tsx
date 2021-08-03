/** @jsx jsx */
import { jsx } from "theme-ui";
import Modal from "../Modal";
import { Box, Button, Flex, Spinner } from "@theme-ui/components";
import { FunctionComponent, useState } from "react";

type ConfirmationModalProps = {
  title?: string;
  actionText: string;
  onClose: Function;
  onAction: Function;
  numStreamsToDelete?: number;
};

const ConfirmationModal: FunctionComponent<ConfirmationModalProps> = ({
  title = "Are you sure?",
  onClose,
  onAction,
  actionText,
  children,
}) => {
  const [showWheel, setShowWheel] = useState(false);
  return (
    <Modal onClose={onClose}>
      <h3>{title}</h3>
      <Box sx={{ my: 3 }}>{children}</Box>
      <Flex sx={{ justifyContent: "flex-end" }}>
        <Button
          type="button"
          variant="outlineSmall"
          onClick={onClose}
          sx={{ mr: 2 }}>
          Cancel
        </Button>
        {showWheel ? (
          <Spinner></Spinner>
        ) : (
          <Button
            type="button"
            variant="primarySmall"
            onClick={() => {
              setShowWheel(true);
              onAction();
            }}>
            {actionText}
          </Button>
        )}
      </Flex>
    </Modal>
  );
};

export default ConfirmationModal;
