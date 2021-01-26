import Button from "components/Button";

interface Props {
  pageFirstRowIndex: number;
  pageLastRowIndex: number;
  numberOfRows: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

const Paginator = ({
  pageFirstRowIndex,
  pageLastRowIndex,
  numberOfRows,
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
}: Props) => (
  <nav
    className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6"
    aria-label="Pagination">
    <div className="hidden sm:block">
      <p className="text-sm text-gray-700">
        Mostrando <span className="font-medium">{pageFirstRowIndex}</span> a{" "}
        <span className="font-medium">{pageLastRowIndex}</span> de{" "}
        <span className="font-medium">{numberOfRows}</span>{" "}
        {numberOfRows === 1 ? "fila" : "filas"}
      </p>
    </div>
    <div className="flex-1 flex justify-between sm:justify-end space-x-3">
      <Button
        variant="white"
        onClick={onPreviousPage}
        disabled={!canPreviousPage}>
        Anterior
      </Button>
      <Button variant="white" onClick={onNextPage} disabled={!canNextPage}>
        Próxima
      </Button>
    </div>
  </nav>
);

export default Paginator;
