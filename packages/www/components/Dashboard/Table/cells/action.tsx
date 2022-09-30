import { CellComponentProps, TableData } from "../types";
import { Box, Button } from "@livepeer/design-system";
import Spinner from "components/Dashboard/Spinner";
import { TrashIcon } from "@radix-ui/react-icons";
import ReactTooltip from "react-tooltip";
import { useState } from "react";

const DeleteActionCell = ({
  id,
  onDelete,
}: {
  id: string;
  onDelete(): void;
}) => {
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const tooltipId = `delete-button-${id}`;

  return (
    <>
      <ReactTooltip
        id={tooltipId}
        className="tooltip"
        place="top"
        type="dark"
        effect="solid"
        delayShow={500}>
        Delete
      </ReactTooltip>

      <Box css={{ textAlign: "right" }}>
        <Button
          data-tip
          data-for={tooltipId}
          onClick={() => {
            setIsDeleteLoading(true);
            onDelete();
          }}
          disabled={isDeleteLoading}
          ghost
          css={{
            borderRadius: "50%",
            width: "$6",
            height: "$6",
            margin: "-$1 $2 -$1 0",
            transition: "0.2s",
            "&:hover": {
              backgroundColor: "$neutral4",
            },
          }}>
          {isDeleteLoading ? (
            <Spinner css={{ width: "$3", height: "$3" }} />
          ) : (
            <TrashIcon />
          )}
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
