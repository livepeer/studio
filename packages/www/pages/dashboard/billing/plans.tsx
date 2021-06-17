import Layout from "../../../layouts/dashboard";
import { Box, Flex, Heading } from "@livepeer.com/design-system";
import { useApi, useLoggedIn } from "hooks";

const Plans = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user || user.emailValid === false) {
    return <Layout />;
  }
  return (
    <Layout
      id="billing/plans"
      breadcrumbs={[
        { title: "Billing", href: "/dashboard/billing/plans" },
        { title: "Plans" },
      ]}>
      <Box css={{ p: "$6" }}>
        <Box css={{ mb: "$8" }}>
          <Flex
            justify="between"
            align="end"
            css={{
              borderBottom: "1px solid",
              borderColor: "$mauve6",
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
      </Box>
    </Layout>
  );
};

export default Plans;
