/** @jsx jsx */
import { jsx } from "theme-ui";
import Button from "components/Admin/Button";
import { Box } from "@theme-ui/components";

interface Props {
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

const Paginator = ({
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
}: Props) =>
  canPreviousPage || canNextPage ? (
    <Box
      as="nav"
      aria-label="Pagination"
      sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
      <Button
        variant="outlineSmall"
        onClick={onPreviousPage}
        disabled={!canPreviousPage}
        sx={{ mr: 3 }}>
        Previous page
      </Button>
      <Button
        variant="outlineSmall"
        onClick={onNextPage}
        disabled={!canNextPage}>
        Next page
      </Button>
    </Box>
  ) : null;

export default Paginator;
