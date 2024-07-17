import { useQuery } from "react-query";
import WebhookDetails from "components/WebhookDetails";
import { DashboardWebhooks as Content } from "content";
import { useProjectContext } from "context/ProjectContext";
import { useApi, useLoggedIn } from "hooks";
import Layout from "layouts/dashboard";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const WebhookDetail = () => {
  useLoggedIn();
  const { user } = useApi();
  const [logFilters, setLogFilters] = useState();

  const { getWebhook, getWebhookLogs } = useApi();
  const { appendProjectId } = useProjectContext();

  const searchParams = useSearchParams();
  const id = searchParams.get("id") as string;

  const { data: webhookData } = useQuery(
    ["webhook", id],
    () => getWebhook(id),
    {
      enabled: !!id,
    },
  );

  const { data: logs, refetch: refetchLogs } = useQuery(
    ["webhookLogs", id, logFilters],
    () => getWebhookLogs(id, logFilters),
    {
      enabled: !!id,
      initialData: [],
    },
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
        {
          title: "Webhooks",
          href: appendProjectId("/developers/webhooks"),
        },
        { title: webhookData?.name },
      ]}
      {...Content.metaData}>
      <WebhookDetails
        handleLogFilters={handleLogFilters}
        id={id}
        data={webhookData}
        logs={logs}
        refetchLogs={refetchLogs}
      />
    </Layout>
  );
};

export default WebhookDetail;
