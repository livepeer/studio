import Layout from "layouts/dashboard";
import { useApi, useLoggedIn } from "hooks";
import { useCallback } from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import WebhookDetails from "components/Dashboard/WebhookDetails";

const WebhookDetail = () => {
  useLoggedIn();
  const { user } = useApi();

  const { getWebhook } = useApi();
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
      <WebhookDetails id={id} data={data} />
    </Layout>
  );
};

export default WebhookDetail;
