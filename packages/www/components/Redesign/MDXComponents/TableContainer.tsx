import { Box } from "@livepeer.com/design-system";

const TableContainer = ({
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}) => {
  return (
    <Box
      as="div"
      role="region"
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
  );
};

export default TableContainer;
