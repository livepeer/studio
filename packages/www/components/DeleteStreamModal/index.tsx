import Modal from "../Modal";
import { Box, Button, Flex } from "@theme-ui/components";

type DeleteStreamModalProps = {
  streamName: string;
  onClose: Function;
  onDelete: Function;
  numStreamsToDelete?: number;
};

const DeleteStreamModal = ({
  streamName,
  onClose,
  onDelete,
  numStreamsToDelete,
}: DeleteStreamModalProps) => {
  return (
    <Modal onClose={onClose}>
      <h3>Are you sure?</h3>
      <Box sx={{ my: 3 }}>
        {numStreamsToDelete > 1
          ? `Are you sure you want to delete ${numStreamsToDelete} streams? Deleting streams
        cannot be undone.`
          : `Are you sure you want to delete stream "${streamName}"? Deleting a stream
        cannot be undone.`}
      </Box>
      <Flex sx={{ justifyContent: "flex-end" }}>
        <Button
          type="button"
          variant="outlineSmall"
          onClick={onClose}
          sx={{ mr: 2 }}>
          Cancel
        </Button>
        <Button type="button" variant="primarySmall" onClick={onDelete}>
          Delete
        </Button>
      </Flex>
    </Modal>
  );
};

export default DeleteStreamModal;
