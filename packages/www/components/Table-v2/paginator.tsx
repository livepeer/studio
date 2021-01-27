import Button from "components/Button";

interface Props {
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

// TODO fix this tailwind
const Paginator = ({
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
}: Props) => (
  <nav
    className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
    aria-label="Pagination">
    <div className="flex-1 flex justify-between sm:justify-end space-x-3">
      <Button
        variant="white"
        onClick={onPreviousPage}
        disabled={!canPreviousPage}>
        Previous
      </Button>
      <Button variant="white" onClick={onNextPage} disabled={!canNextPage}>
        Next
      </Button>
    </div>
  </nav>
);

export default Paginator;
