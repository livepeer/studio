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
  const [logFilters, setLogFilters] = useState([]);
  const [logs, setLogs] = useState<any>({
    data: [],
    cursor: null,
    totalCount: 0,
    failedCount: 0,
    successCount: 0,
  });
  const [loadingMore, setLoadingMore] = useState(false);

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

  const { refetch: refetchLogs, isLoading: isLogsLoading } = useQuery(
    ["webhookLogs", id, logFilters],
    () => getWebhookLogs(id, logFilters, logs ? logs.cursor : null, true),
    {
      enabled: !!id,
      onSuccess: (data) => {
        const containsSuccessFilter = logFilters.some(
          (filter) => filter.id === "success"
        );

        if (containsSuccessFilter) {
          setLogs({
            ...data,
            data: loadingMore ? [...logs.data, ...data.data] : data.data,
            totalCount: logs.totalCount,
            failedCount: logs.failedCount,
            successCount: logs.successCount,
          });
        } else {
          setLogs({
            ...data,
            data: loadingMore ? [...logs.data, ...data.data] : data.data,
          });
        }

        setLoadingMore(false);
      },
    }
  );

  const handleLogFilters = async (filters) => {
    if (filters.length === 0) {
      setLogFilters([]);
      refetchLogs();
      return;
    }

    const newFilters = logFilters.filter(
      (existingFilter) =>
        !filters.some((newFilter) => newFilter.id === existingFilter.id)
    );

    setLogFilters([...newFilters, ...filters]);
    refetchLogs();
  };

  if (!user) {
    return <Layout />;
  }

  const loadMore = () => {
    if (logs.cursor) {
      setLoadingMore(true);
      refetchLogs();
    }
  };

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
        refetchLogs={refetchLogs}
        loadMore={loadMore}
        isLogsLoading={isLogsLoading}
      />
    </Layout>
  );
};

export default WebhookDetail;
