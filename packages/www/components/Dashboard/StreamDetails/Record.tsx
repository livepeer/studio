import {
  Box,
  DropdownMenuItem,
  Switch,
  useSnackbar,
} from "@livepeer.com/design-system";
import { useToggleState } from "hooks/use-toggle-state";
import { useApi } from "../../../hooks";
import ErrorDialog from "../ErrorDialog";

const Record = ({ stream, invalidate, isSwitch = true }) => {
  const { patchStream } = useApi();
  const [openSnackbar] = useSnackbar();
  const errorRecordDialogState = useToggleState();

  const onCheckedChange = async (e) => {
    e.preventDefault();
    if (stream.isActive) {
      errorRecordDialogState.onOn();
    } else if (!stream.record) {
      await patchStream(stream.id, { record: true });
      await invalidate();
      openSnackbar("Recording has been turned on.");
    } else {
      await patchStream(stream.id, { record: false });
      await invalidate();
      openSnackbar("Recording has been turned off.");
    }
  };

  return (
    <Box>
      {isSwitch ? (
        <Switch
          checked={!!stream.record}
          name="record-mode"
          value={`${!!stream.record}`}
          onCheckedChange={(e) => onCheckedChange(e)}
        />
      ) : (
        <Box as={DropdownMenuItem} onSelect={(e) => onCheckedChange(e)}>
          <Box>{!stream.record ? "Enable recording" : "Disable recording"}</Box>
        </Box>
      )}

      <ErrorDialog
        isOpen={errorRecordDialogState.on}
        onOpenChange={errorRecordDialogState.onToggle}
        description="You cannot change recording preferences while a session is active"
      />
    </Box>
  );
};

export default Record;
