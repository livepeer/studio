import { Box, Container } from "@livepeer.com/design-system";

const TableContainer = ({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}) => {
  return (
    <Box
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      tabIndex={0}
      css={{
        overflow: "auto",
        "&:focus": {
          outline: 0,
        },
      }}>
      <Box as="table" {...props} />
    </Box>
  );
};

export default TableContainer;
