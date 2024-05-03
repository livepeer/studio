import Layout from "layouts/dashboard";
import { useApi, useLoggedIn } from "hooks";
import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { useQuery, useQueryClient } from "react-query";
import WebhookDetails from "components/WebhookDetails";
import { DashboardWebhooks as Content } from "content";
import useProject from "hooks/use-project";

const WebhookDetail = () => {
  useLoggedIn();
  const { user } = useApi();
  const [logFilters, setLogFilters] = useState();

  const { getWebhook, getWebhookLogs } = useApi();
  const { appendProjectId } = useProject();

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
<<<<<<<< HEAD:packages/www/pages/dashboard/projects/[projectId]/developers/webhooks/[id].tsx
        {
          title: "Webhooks",
          href: appendProjectId("/developers/webhooks"),
        },
========
        { title: "Webhooks", href: "/developers/webhooks" },
>>>>>>>> a55ccc19426eaf2a60fae87b2a1f7abb9c31c7b2:packages/www/pages/developers/webhooks/[id].tsx
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
