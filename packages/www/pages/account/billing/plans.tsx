<<<<<<<< HEAD:packages/www/pages/dashboard/account/billing/plans.tsx
import Layout from "../../../../layouts/dashboard";
========
import Layout from "../../layouts/dashboard";
>>>>>>>> a55ccc19426eaf2a60fae87b2a1f7abb9c31c7b2:packages/www/pages/billing/plans.tsx
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
<<<<<<<< HEAD:packages/www/pages/dashboard/account/billing/plans.tsx
      id="account/plans"
      breadcrumbs={[{ title: "Plans" }]}
========
      id="billing/plans"
      breadcrumbs={[{ title: "Billing", href: "/billing" }, { title: "Plans" }]}
>>>>>>>> a55ccc19426eaf2a60fae87b2a1f7abb9c31c7b2:packages/www/pages/billing/plans.tsx
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
