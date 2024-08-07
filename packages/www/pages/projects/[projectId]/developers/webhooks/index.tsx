import Layout from "layouts/dashboard";
import { useApi, useLoggedIn } from "hooks";
import WebhooksTable from "components/WebhooksTable";
import { DashboardWebhooks as Content } from "content";
import { useProjectContext } from "context/ProjectContext";

const Webhooks = () => {
  useLoggedIn();
  const { user } = useApi();
  const { appendProjectId } = useProjectContext();

  if (!user) {
    return <Layout />;
  }

  return (
    <Layout
      id="developers/webhooks"
      breadcrumbs={[
        {
          title: "Developers",
          href: appendProjectId("/developers/webhooks"),
        },
        { title: "Webhooks" },
      ]}
      {...Content.metaData}>
      <WebhooksTable />
    </Layout>
  );
};

export default Webhooks;
