import Layout from "layouts/dashboard";
import { useApi, useLoggedIn } from "hooks";
import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { useQuery, useQueryClient } from "react-query";
import WebhookDetails from "components/WebhookDetails";
import { DashboardWebhooks as Content } from "content";

const WebhookDetail = () => {
  useLoggedIn();
  const { user } = useApi();
  const [logFilters, setLogFilters] = useState();
  const queryClient = useQueryClient();

  const { getWebhook, getWebhookLogs } = useApi();
  const router = useRouter();
  const { id } = router.query;

  const { data: webhookData } = useQuery(
    ["webhook", id],
    () => getWebhook(id),
    {
      enabled: !!id,
    }
  );

  const { data: logs, refetch: refetchLogs } = useQuery(
    ["webhookLogs", id, logFilters],
    () => getWebhookLogs(id, logFilters),
    {
      enabled: !!id,
      initialData: [],
    }
  );

  const handleLogFilters = async (filters) => {
    setLogFilters(filters);
    refetchLogs();
  };

  if (!user) {
    return <Layout />;
  }

  return (
    <Layout
      id="developers/webhooks"
      breadcrumbs={[
        { title: "Developers" },
        { title: "Webhooks", href: "/dashboard/developers/webhooks" },
        { title: webhookData?.name },
      ]}
      {...Content.metaData}>
      <WebhookDetails
        handleLogFilters={handleLogFilters}
        id={id}
        data={webhookData}
        logs={logs}
      />
    </Layout>
  );
};

export default WebhookDetail;
