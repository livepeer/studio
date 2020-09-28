import Modal from "../Modal";
import { Box, Button, Flex } from "@theme-ui/components";

type DeleteStreamModalProps = {
  streamName: string;
  onClose: Function;
  onDelete: Function;
};

export default ({ streamName, onClose, onDelete }: DeleteStreamModalProps) => {
  return (
    <Modal onClose={onClose}>
      <h3>Are you sure?</h3>
      <Box sx={{ my: 3 }}>
        Are you sure you want to delete stream "{streamName}"? Deleting a stream
        cannot be undone.
      </Box>
      <Flex sx={{ justifyContent: "flex-end" }}>
        <Button
          type="button"
          variant="outlineSmall"
          onClick={onClose}
          sx={{ mr: 2 }}
        >
          Cancel
        </Button>
        <Button type="button" variant="primarySmall" onClick={onDelete}>
          Delete
        </Button>
      </Flex>
    </Modal>
  );
};
