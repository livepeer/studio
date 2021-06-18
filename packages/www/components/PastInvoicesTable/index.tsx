/** @jsx jsx */
import { jsx } from "theme-ui";
import { Box, Link as A } from "@theme-ui/components";
import { Table, TableRow, TableRowVariant } from "../Table";
import { products } from "@livepeer.com/api/src/config";
import { FiArrowUpRight } from "react-icons/fi";

const PastInvoicesTable = ({ invoices }) => {
  return (
    <Table sx={{ gridTemplateColumns: "auto auto auto auto" }}>
      <TableRow variant={TableRowVariant.Header}>
        <Box>Date</Box>
        <Box>Summary</Box>
        <Box>Amount</Box>
        <Box>Download</Box>
      </TableRow>
      {invoices.data
        .filter((invoice) => invoice.lines.total_count > 1)
        .map((invoice, i) => (
          <TableRow key={i}>
            <Box>
              {new Date(invoice.created * 1000).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
              })}
            </Box>
            <Box>
              {
                products[
                  invoice.lines.data.filter(
                    (item) => item.type === "subscription"
                  )[0]?.plan.product
                ].name
              }{" "}
              Plan
            </Box>
            <Box>${(invoice.total / 100).toFixed(2)}</Box>
            <Box>
              <A
                variant="buttons.outlineSmall"
                download
                target="_blank"
                rel="noopener noreferrer"
                href={invoice.hosted_invoice_url}
                sx={{ display: "flex", alignItems: "center" }}>
                Invoice
                <FiArrowUpRight sx={{ ml: 1 }} />
              </A>
            </Box>
          </TableRow>
        ))}
    </Table>
  );
};

export default PastInvoicesTable;
