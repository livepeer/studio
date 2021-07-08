import { Button } from "@livepeer.com/design-system";

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
    <nav
      aria-label="Pagination"
      css={{ display: "flex", justifyContent: "center", mt: 3 }}>
      <Button
        onClick={onPreviousPage}
        disabled={!canPreviousPage}
        css={{ mr: 3 }}>
        Previous page
      </Button>
      <Button onClick={onNextPage} disabled={!canNextPage}>
        Next page
      </Button>
    </nav>
  ) : null;

export default Paginator;
