import Layout from "layouts/dashboard";
import { useApi, useLoggedIn } from "hooks";
import WebhooksTable from "components/WebhooksTable";
import { DashboardWebhooks as Content } from "content";
import useProject from "hooks/use-project";

const Webhooks = () => {
  useLoggedIn();
  const { user } = useApi();
  const { appendProjectId } = useProject();

  if (!user) {
    return <Layout />;
  }

  return (
    <Layout
      id="developers/webhooks"
      breadcrumbs={[
<<<<<<<< HEAD:packages/www/pages/dashboard/projects/[projectId]/developers/webhooks/index.tsx
        {
          title: "Developers",
          href: appendProjectId("/developers/webhooks"),
        },
========
        { title: "Developers", href: "/developers/webhooks" },
>>>>>>>> a55ccc19426eaf2a60fae87b2a1f7abb9c31c7b2:packages/www/pages/developers/webhooks/index.tsx
        { title: "Webhooks" },
      ]}
      {...Content.metaData}>
      <WebhooksTable />
    </Layout>
  );
};

export default Webhooks;
