import { CellComponentProps, TableData } from "../types";
import { Box, Button } from "@livepeer/design-system";
import { CrossCircledIcon } from "@radix-ui/react-icons";

const DeleteActionCell = ({ onDelete }: { onDelete(): void }) => {
  return (
    <Box css={{ textAlign: "right" }}>
      <Button
        onClick={onDelete}
        css={{
          borderRadius: "50%",
          width: "$6",
          height: "$6",
          margin: "-$1 0",
        }}>
        <CrossCircledIcon />
      </Button>
    </Box>
  );
};

export type ActionCellProps = {
  isStatusFailed: boolean;
  onDelete(): void;
};

const ActionCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, ActionCellProps>) => {
  if (cell.value.isStatusFailed) {
    return <DeleteActionCell onDelete={cell.value.onDelete} />;
  }
  return <></>;
};

export default ActionCell;
