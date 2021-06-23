import { Table, Thead, Tbody, Tr, Th, Td } from "@livepeer.com/design-system";

const UpcomingInvoiceTable = ({ subscription, usage, prices }) => {
  const transcodingPrice = prices[0].price;

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
          <Th>Item</Th>
          <Td>Usage</Td>
          <Td>Unit Price</Td>
          <Td>Amount Due</Td>
        </Tr>
      </Thead>
      <Tbody>
        <Tr>
          <Th>Transcoding</Th>
          <Td>
            {usage && (usage.sourceSegmentsDuration / 60).toFixed(2)} minutes
          </Td>
          <Td>${transcodingPrice} / min</Td>
          <Td>
            {usage &&
              `$${(
                (usage.sourceSegmentsDuration / 60) *
                transcodingPrice
              ).toFixed(2)}`}
          </Td>
        </Tr>

        <Tr>
          <Th
            css={{
              textTransform: "uppercase",
              fontSize: "$2",
              fontWeight: 600,
            }}>
            Total
          </Th>
          <Td css={{ fontSize: "$2" }}>
            Due on{" "}
            {new Date(
              subscription.current_period_end * 1000
            ).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Td>
          <Td></Td>
          <Td css={{ fontSize: "$2", fontWeight: 600 }}>
            {usage &&
              `$${(
                (usage.sourceSegmentsDuration / 60) *
                transcodingPrice
              ).toFixed(2)}`}
          </Td>
        </Tr>
      </Tbody>
    </Table>
  );
};

export default UpcomingInvoiceTable;
