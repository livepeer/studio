import Layout from "../../../layouts/dashboard";
import { Box, Flex, Heading } from "@livepeer/design-system";
import { useApi, useLoggedIn } from "hooks";
import Plans from "components/Plans";
import { DashboardPlans as Content } from "content";

const PlansPage = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user) {
    return <Layout />;
  }
  return (
    <Layout
      id="settings/plans"
      breadcrumbs={[{ title: "Plans" }]}
      {...Content.metaData}>
      <Box css={{ p: "$6" }}>
        <Box css={{ mb: "$6" }}>
          <Flex
            justify="between"
            align="end"
            css={{
              borderBottom: "1px solid",
              borderColor: "$neutral6",
              pb: "$4",
              mb: "$5",
              width: "100%",
            }}>
            <Heading size="2">
              <Flex>
                <Box
                  css={{
                    mr: "$3",
                    fontWeight: 600,
                    letterSpacing: "0",
                  }}>
                  Plans
                </Box>
              </Flex>
            </Heading>
          </Flex>
        </Box>
        <Plans
          dashboard={true}
          stripeProductId={
            user?.stripeProductId ? user.stripeProductId : "prod_O9XuIjn7EqYRVW"
          }
        />
      </Box>
    </Layout>
  );
};

export default PlansPage;
