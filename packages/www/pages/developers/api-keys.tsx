<<<<<<<< HEAD:packages/www/pages/dashboard/projects/[projectId]/developers/api-keys.tsx
import Layout from "../../../../../layouts/dashboard";
========
import Layout from "../../layouts/dashboard";
>>>>>>>> a55ccc19426eaf2a60fae87b2a1f7abb9c31c7b2:packages/www/pages/developers/api-keys.tsx
import { Box } from "@livepeer/design-system";
import { useApi, useLoggedIn } from "hooks";
import ApiKeysTable from "components/ApiKeys";
import { DashboardAPIKeys as Content } from "content";
<<<<<<<< HEAD:packages/www/pages/dashboard/projects/[projectId]/developers/api-keys.tsx
import Ripe, { categories, pages } from "lib/ripe";
import useProject from "hooks/use-project";

Ripe.trackPage({
  category: categories.DASHBOARD,
  name: pages.API_KEY,
});
========
>>>>>>>> a55ccc19426eaf2a60fae87b2a1f7abb9c31c7b2:packages/www/pages/developers/api-keys.tsx

const ApiKeys = () => {
  useLoggedIn();
  const { user } = useApi();
  const { appendProjectId } = useProject();

  if (!user) {
    return <Layout />;
  }
  return (
    <Layout
      id="developers"
      breadcrumbs={[
<<<<<<<< HEAD:packages/www/pages/dashboard/projects/[projectId]/developers/api-keys.tsx
        {
          title: "Developers",
          href: appendProjectId("/developers/api-keys"),
        },
========
        { title: "Developers", href: "/developers/api-keys" },
>>>>>>>> a55ccc19426eaf2a60fae87b2a1f7abb9c31c7b2:packages/www/pages/developers/api-keys.tsx
        { title: "API Keys" },
      ]}
      {...Content.metaData}>
      <Box css={{ p: "$6" }}>
        <Box css={{ mb: "$8" }}>
          <ApiKeysTable userId={user.id} />
        </Box>
      </Box>
    </Layout>
  );
};

export default ApiKeys;
