import { Box, Text, Link as A } from "@livepeer.com/design-system";
import Link from "next/link";
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
      css={{
        width: "100%",
        textAlign: "left",
        borderCollapse: "collapse",
      }}
      aria-label={hasAriaLabel ? ariaLabel : "Component Props"}
      aria-labelledby={ariaLabelledBy}>
      <Box as="thead">
        <Box as="tr">
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
        </Box>
      </Box>
      <Box as="tbody">
        {data.map((row, i) => (
          <Box as="tr" key={`-${i}`}>
            {Object.entries(row).map(([key, value], i) => (
              <Box
                key={i}
                as="td"
                css={{
                  borderBottom: "1px solid $gray6",
                  py: "$3",
                  pr: "$4",
                }}>
                {key === "link" ? (
                  <Link href={value as string} passHref>
                    <A variant="violet">{value}</A>
                  </Link>
                ) : (
                  <Text>{value}</Text>
                )}
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </TableContainer>
  );
};

export default Table;
