import { Box, Text, Code } from "@livepeer.com/design-system";
import TableContainer from "./TableContainer";

type PropDef = {
  name: string;
  required?: boolean;
  default?: string | boolean;
  type: string;
  typeSimple: string;
  description?: string;
};

const Table = ({
  data,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: {
  data: PropDef[];
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) => {
  const hasAriaLabel = !!(ariaLabel || ariaLabelledBy);
  const rows = [...new Set(data.flatMap((x) => Object.keys(x)))];
  return (
    <TableContainer
      css={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}
      aria-label={hasAriaLabel ? ariaLabel : "Component Props"}
      aria-labelledby={ariaLabelledBy}>
      <thead>
        <tr>
          {rows.map((row, i) => (
            <Box
              key={`${row}-${i}`}
              as="th"
              css={{
                borderBottom: "1px solid $gray6",
                py: "$3",
                pr: "$4",
              }}>
              <Text size="2" css={{ textTransform: "capitalize" }}>
                {row}
              </Text>
            </Box>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={`-${i}`}>
            {Object.entries(row).map(([, value], i) => (
              <Box
                key={i}
                as="td"
                css={{
                  borderBottom: "1px solid $gray6",
                  py: "$3",
                  pr: "$4",
                }}>
                <Text>{value}</Text>
              </Box>
            ))}
          </tr>
        ))}
      </tbody>
    </TableContainer>
  );
};

export default Table;
