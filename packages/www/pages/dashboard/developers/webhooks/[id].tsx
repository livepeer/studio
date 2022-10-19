import Layout from "layouts/dashboard";
import { useApi, useLoggedIn } from "hooks";
import { useCallback } from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import Webhook from "@components/Dashboard/Webhook";

const WebhookDetail = () => {
  useLoggedIn();
  const { user } = useApi();

  const { getWebhook, deleteWebhook, updateWebhook } = useApi();
  const router = useRouter();
  const { id } = router.query;

  const fetcher = useCallback(async () => {
    if (!id) return null;
    return await getWebhook(id);
  }, [id]);

  const { data } = useQuery([id], () => fetcher());

  if (!user) {
    return <Layout />;
  }

  return (
    <Layout
      id="developers/webhooks"
      breadcrumbs={[
        { title: "Developers" },
        { title: "Webhooks", href: "/dashboard/developers/webhooks" },
        { title: data?.name },
      ]}>
      <Webhook
        id={id}
        data={data}
        deleteWebhook={deleteWebhook}
        updateWebhook={updateWebhook}
      />
    </Layout>
  );
};

export default WebhookDetail;
