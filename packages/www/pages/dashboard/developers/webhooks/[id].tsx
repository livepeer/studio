import Layout from "../../../../layouts/dashboard";
import { Box } from "@livepeer.com/design-system";
import { useApi, useLoggedIn } from "hooks";
import { useCallback } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import WebhookDetails from "@components/Dashboard/WebhookDetails";

const ApiKeys = () => {
  useLoggedIn();
  const { user, getWebhook } = useApi();
  const router = useRouter();
  const { id } = router.query;

  const fetcher = useCallback(async () => {
    const webhook = await getWebhook(id);
    return webhook;
  }, [id]);

  const { data } = useSWR([id], () => fetcher());

  return !user || user.emailValid === false ? null : (
    <Layout
      id="developers/webhooks"
      breadcrumbs={[
        { title: "Developers" },
        { title: "Webhooks", href: "/dashboard/developers/webhooks" },
        { title: data?.name },
      ]}>
      <Box css={{ p: "$6" }}>
        <Box css={{ mb: "$8" }}>
          {data && <WebhookDetails webhook={data} />}
        </Box>
      </Box>
    </Layout>
  );
};

export default ApiKeys;
