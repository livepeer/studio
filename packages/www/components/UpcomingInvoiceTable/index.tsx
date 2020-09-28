import { Box } from "@theme-ui/components";
import { Table, TableRow, TableRowVariant } from "../Table";

const UpcomingInvoiceTable = ({ subscription, usage, prices }) => {
  const transcodingPrice = prices[0].price;

  return (
    <Table sx={{ gridTemplateColumns: "auto auto auto auto" }}>
      <TableRow variant={TableRowVariant.Header}>
        <Box>Item</Box>
        <Box>Usage</Box>
        <Box>Unit Price</Box>
        <Box>Amount Due</Box>
      </TableRow>
      <TableRow>
        <Box>Transcoding</Box>
        <Box>
          {usage && (usage.sourceSegmentsDuration / 60).toFixed(2)} minutes
        </Box>
        <Box>${transcodingPrice} / min</Box>
        <Box>
          {usage &&
            `$${(
              (usage.sourceSegmentsDuration / 60) *
              transcodingPrice
            ).toFixed(2)}`}
        </Box>
      </TableRow>
      {/* <TableRow>
        <Box>Storage</Box>
        <Box>0 GB</Box>
        <Box>$0.002 / GB</Box>
        <Box>$0.00</Box>
      </TableRow>
      <TableRow>
        <Box>Streaming</Box>
        <Box>0 GB</Box>
        <Box>$0.003 / GB</Box>
        <Box>$0.00</Box>
      </TableRow> */}
      <TableRow>
        <Box sx={{ textTransform: "uppercase", fontSize: 2, fontWeight: 600 }}>
          Total
        </Box>
        <Box sx={{ fontSize: 2 }}>
          Due on{" "}
          {new Date(subscription.current_period_end * 1000).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric"
            }
          )}
        </Box>
        <Box></Box>
        <Box sx={{ fontSize: 2, fontWeight: 600 }}>
          {usage &&
            `$${(
              (usage.sourceSegmentsDuration / 60) *
              transcodingPrice
            ).toFixed(2)}`}
        </Box>
      </TableRow>
    </Table>
  );
};

export default UpcomingInvoiceTable;
