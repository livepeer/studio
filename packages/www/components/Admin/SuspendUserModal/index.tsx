/** @jsxImportSource @emotion/react */
import { useState } from "react";
import { useApi } from "hooks";
import Modal from "../Modal";
import { Button, Flex } from "@theme-ui/components";
import { Box, Checkbox, Label, Tooltip } from "@livepeer/design-system";
import { User } from "@livepeer.com/api";

type Props = {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuspend: () => PromiseLike<void> | void;
};

const SuspendUserModal = ({ user, isOpen, onClose, onSuspend }: Props) => {
  const [isCopyrightInfringiment, setIsCopyrightInfringiment] = useState(true);
  const { setUserSuspended } = useApi();

  return !(user && isOpen) ? null : (
    <Modal onClose={onClose}>
      <h3>Suspend user</h3>
      <p>
        Are you sure you want to <b>suspend</b> user "{user.email}"?
      </p>

      <Box sx={{ display: "flex", mt: 2, mb: 2 }}>
        <Checkbox
          id="isCopyrightInfringiment"
          checked={isCopyrightInfringiment}
          style={{ color: "black" }}
          onCheckedChange={(checked: boolean) =>
            setIsCopyrightInfringiment(checked)
          }
        />
        <Tooltip
          content="Checking this will send the copyright infringiment email instead of the default one."
          multiline>
          <Label sx={{ ml: 2 }} htmlFor="isCopyrightInfringiment">
            Copyright infringiment
          </Label>
        </Tooltip>
      </Box>

      <Flex sx={{ justifyContent: "flex-end" }}>
        <Button
          type="button"
          variant="outlineSmall"
          onClick={onClose}
          sx={{ mr: 2 }}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="primarySmall"
          onClick={() => {
            setUserSuspended(user.id, {
              suspended: true,
              emailTemplate: isCopyrightInfringiment ? "copyright" : undefined,
            })
              .then(onSuspend)
              .finally(onClose);
          }}>
          Suspend User
        </Button>
      </Flex>
    </Modal>
  );
};

export default SuspendUserModal;
