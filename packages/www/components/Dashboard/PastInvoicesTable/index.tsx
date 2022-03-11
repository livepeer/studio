import {
  Box,
  Link as A,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@livepeer.com/design-system";
import { products } from "@livepeer.com/api/src/config";
import { FiArrowUpRight } from "react-icons/fi";

const PastInvoicesTable = ({ invoices }) => {
  return (
    <Table
      css={{
        minWidth: "100%",
        borderCollapse: "separate",
        borderSpacing: 0,
        tableLayout: "initial",
      }}>
      <Thead>
        <Tr>
          <Th>Date</Th>
          <Td>Summary</Td>
          <Td>Amount</Td>
          <Td>Download</Td>
        </Tr>
      </Thead>
      <Tbody>
        {invoices.data
          .filter((invoice) => invoice.lines.total_count > 1)
          .map((invoice, i) => (
            <Tr key={i}>
              <Th>
                {new Date(invoice.created * 1000).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })}
              </Th>
              <Td>
                {
                  products[
                    invoice.lines.data.filter(
                      (item) => item.type === "subscription"
                    )[0]?.plan.product
                  ]?.name
                }{" "}
                Plan
              </Td>
              <Td>${(invoice.total / 100).toFixed(2)}</Td>
              <Td>
                <A
                  variant="violet"
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  href={invoice.hosted_invoice_url}
                  css={{ display: "flex", alignItems: "center" }}>
                  Invoice
                  <FiArrowUpRight css={{ ml: 1 }} />
                </A>
              </Td>
            </Tr>
          ))}
      </Tbody>
    </Table>
  );
};

export default PastInvoicesTable;
