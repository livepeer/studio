import { Box } from "@livepeer.com/design-system";
import { Webhook } from "@livepeer.com/api";

type Props = {
  webhook: Webhook;
};

const WebhookDetails = ({ webhook }: Props) => {
  return (
    <Box>
      <Box>{webhook.url}</Box>
      <Box>{webhook.name}</Box>
      <Box>{webhook.createdAt}</Box>
      <Box>{webhook.event}</Box>
    </Box>
  );
};

export default WebhookDetails;
