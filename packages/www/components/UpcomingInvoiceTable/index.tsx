import { Table, Thead, Tbody, Tr, Th, Td } from "@livepeer/design-system";

const UpcomingInvoiceTable = ({
  subscription,
  usage,
  product,
  overUsageBill,
  upcomingInvoice,
}) => {
  const price = product.monthlyPrice;
  const transcodingPrice = product.usage[0].price;
  const deliveryPrice = product.usage[1].price;
  const storagePrice = product.usage[2].price;

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
          <Th>Monthly Subscription</Th>
          <Td></Td>
          <Td>${price} / month</Td>
          <Td>{usage && `$${price}`}</Td>
        </Tr>
        <Tr>
          <Th>Transcoding</Th>
          <Td>{usage && usage.TotalUsageMins.toFixed(2)} minutes</Td>
          <Td>${transcodingPrice} / min</Td>
          <Td>
            {overUsageBill &&
              `$${overUsageBill.transcodingBill.total.toFixed(2)}`}
          </Td>
        </Tr>
        <Tr>
          <Th>Delivery</Th>
          <Td>{usage && usage.DeliveryUsageMins.toFixed(2)} minutes</Td>
          <Td>${deliveryPrice} / min</Td>
          <Td>
            {overUsageBill && `$${overUsageBill.deliveryBill.total.toFixed(2)}`}
          </Td>
        </Tr>
        <Tr>
          <Th>Storage</Th>
          <Td>{usage && usage.StorageUsageMins.toFixed(2)} minutes</Td>
          <Td>${storagePrice} / min</Td>
          <Td>
            {overUsageBill && `$${overUsageBill.storageBill.total.toFixed(2)}`}
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
                price +
                overUsageBill.transcodingBill.total +
                overUsageBill.deliveryBill.total +
                overUsageBill.storageBill.total
              ).toFixed(2)}`}
          </Td>
        </Tr>
      </Tbody>
    </Table>
  );
};

export default UpcomingInvoiceTable;
