import { Box } from "@livepeer.com/design-system";

const TableContainer = ({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}) => {
  return (
    <Box css={{ overflow: "hidden" }}>
      <Box
        as="div"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        tabIndex={0}
        css={{
          position: "relative",
          overflow: "auto",
          "&:focus": {
            outline: 0,
          },
        }}>
        <Box as="table" {...props} />
      </Box>
    </Box>
  );
};

export default TableContainer;
