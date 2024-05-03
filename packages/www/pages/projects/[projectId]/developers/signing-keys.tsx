<<<<<<<< HEAD:packages/www/pages/dashboard/projects/[projectId]/developers/signing-keys.tsx
import Layout from "../../../../../layouts/dashboard";
========
import Layout from "../../layouts/dashboard";
>>>>>>>> a55ccc19426eaf2a60fae87b2a1f7abb9c31c7b2:packages/www/pages/developers/signing-keys.tsx
import { Box } from "@livepeer/design-system";
import { useApi, useLoggedIn } from "hooks";
import { DashboardSigningKeys as Content } from "content";
import SigningKeysTable from "components/SigningKeysTable";
import useProject from "hooks/use-project";

const SigningKeys = () => {
  useLoggedIn();
  const { user } = useApi();
  const { appendProjectId } = useProject();

  if (!user) {
    return <Layout />;
  }
  return (
    <Layout
      id="developers/signing-keys"
      breadcrumbs={[
<<<<<<<< HEAD:packages/www/pages/dashboard/projects/[projectId]/developers/signing-keys.tsx
        {
          title: "Developers",
          href: appendProjectId("/developers/signing-keys"),
        },
========
        { title: "Developers", href: "/developers/signing-keys" },
>>>>>>>> a55ccc19426eaf2a60fae87b2a1f7abb9c31c7b2:packages/www/pages/developers/signing-keys.tsx
        { title: "Signing Keys" },
      ]}
      {...Content.metaData}>
      <Box css={{ p: "$6" }}>
        <Box css={{ mb: "$8" }}>
          <SigningKeysTable tableId="dashboardSigningKeysTable" />
        </Box>
      </Box>
    </Layout>
  );
};

export default SigningKeys;
