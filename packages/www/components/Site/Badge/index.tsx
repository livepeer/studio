import { Box } from "@livepeer/design-system";

const Badge = ({ children, color = "$hiContrast", css }) => (
  <Box
    css={{
      px: "$1",
      fontSize: "$5",
      display: "inline-flex",
      borderRadius: "4px",
      border: `1px solid ${color}`,
      color,
      fontWeight: 500,
      lineHeight: "24px",
      "@bp2": {
        lineHeight: 1,
        fontSize: "$7",
      },
      ...css,
    }}>
    {children}
  </Box>
);

export default Badge;
