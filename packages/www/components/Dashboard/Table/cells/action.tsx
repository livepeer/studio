import { CellComponentProps, TableData } from "../types";
import { Box, Button } from "@livepeer/design-system";
import { CrossCircledIcon } from "@radix-ui/react-icons";
import ReactTooltip from "react-tooltip";

const DeleteActionCell = ({
  id,
  onDelete,
}: {
  id: string;
  onDelete(): void;
}) => {
  const tooltipId = `delete-button-${id}`;
  return (
    <>
      <ReactTooltip
        id={tooltipId}
        className="tooltip"
        place="top"
        type="dark"
        effect="solid">
        Delete
      </ReactTooltip>

      <Box css={{ textAlign: "right" }}>
        <Button
          data-tip
          data-for={tooltipId}
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
    </>
  );
};

export type ActionCellProps = {
  id: string;
  isStatusFailed: boolean;
  onDelete(): void;
};

const ActionCell = <D extends TableData>({
  cell,
}: CellComponentProps<D, ActionCellProps>) => {
  const { id, isStatusFailed, onDelete } = cell.value;

  if (isStatusFailed) {
    return <DeleteActionCell id={id} onDelete={onDelete} />;
  }

  return <></>;
};

export default ActionCell;
