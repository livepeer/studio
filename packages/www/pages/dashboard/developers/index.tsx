import Layout from "../../../layouts/dashboard";
import {
  Box,
  Heading,
  Tabs,
  TabsTrigger,
  TabsList,
  TabLink,
  TabsContent,
} from "@livepeer/design-system";
import { useApi, useLoggedIn } from "hooks";
import ApiKeysTable from "components/ApiKeys";
import { DashboardAPIKeys as Content } from "content";
import WebhooksTable from "components/WebhooksTable";

const Developers = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user) {
    return <Layout />;
  }

  const TT = ({ title, value }) => (
    <TabsTrigger
      css={{
        border: 0,
        fontSize: "$4",
        cursor: "pointer",
        fontWeight: 600,
      }}
      value={value}>
      <Box>{title}</Box>
    </TabsTrigger>
  );

  return (
    <Layout
      id="developers"
      breadcrumbs={[{ title: "Developers" }]}
      {...Content.metaData}>
      <Box css={{ p: "$6", pl: 0 }}>
        <Box css={{ mb: "$7" }}>
          <Box
            css={{
              pb: "$5",
              mb: "$5",
              width: "100%",
            }}>
            <Heading
              size="2"
              css={{
                mr: "$3",
                fontWeight: 600,
                letterSpacing: "0",
              }}>
              Developers
            </Heading>
          </Box>
          <Tabs className="TabsRoot" defaultValue="api-keys">
            <TabsList
              css={{
                borderBottom: "1px solid",
                borderColor: "$neutral6",
                mb: "$6",
                '[data-state="active"]': {
                  pb: "$4",
                  borderBottom: "2px solid !important",
                },
                '[data-state="inactive"]': {
                  pb: "$4",
                  color: "neutral8",
                },
              }}
              className="TabsList"
              aria-label="Manage your account"
              placeholder={""}>
              <TT key={`api-keys`} value={`api-keys`} title={"API Keys"} />
              <TT key={`webhooks`} value={`webhooks`} title={"Webhooks"} />
              <TT key={`logs`} value={`logs`} title={"Logs"} />
            </TabsList>
            <TabsContent value="api-keys">
              <ApiKeysTable userId={user.id} title="" />
            </TabsContent>
            <TabsContent value="webhooks">
              <WebhooksTable title="" />
            </TabsContent>
          </Tabs>
        </Box>
      </Box>
    </Layout>
  );
};

export default Developers;
