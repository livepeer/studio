import Layout from "../../layouts/dashboard";
import {
  styled,
  Box,
  Flex,
  Button,
  Text,
  Promo,
} from "@livepeer.com/design-system";
import GettingStarted from "components/Dashboard/GettingStarted";
import UsageSummary from "components/Dashboard/UsageSummary";
import StreamsTable from "components/Dashboard/StreamsTable";
import { useLoggedIn, useApi } from "hooks";
import InfoIcon from "../../public/img/icons/info.svg";
import Link from "next/link";
import { products } from "@livepeer.com/api/src/config";

const Dashboard = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user || user.emailValid === false) {
    return <Layout />;
  }
  const showPromo = !products[user.stripeProductId].order;

  return (
    <Layout id="home" breadcrumbs={[{ title: "Home" }]}>
      <Box css={{ p: "$6" }}>
        {true && (
          <Promo size="2" css={{ mb: "$7" }}>
            <Flex>
              {/* <StyledInfoIcon /> */}
              <Box>
                <Text
                  size="2"
                  css={{ fontSize: "14px", mb: "$1", fontWeight: 500 }}>
                  Upgrade to Pro
                </Text>
                <Text variant="gray" size="2" css={{ lineHeight: 1.4 }}>
                  Upgrade to the Pro plan and enjoy unlimited transcoding and
                  streaming minutes.
                </Text>
              </Box>
            </Flex>
            <Flex align="center" justify="end">
              <Link href="/dashboard/billing/plans" passHref>
                <Button as="a" size="2" css={{ cursor: "default" }}>
                  Upgrade to Pro
                </Button>
              </Link>
            </Flex>
          </Promo>
        )}
        <Box css={{ mb: "$9" }}>
          <GettingStarted firstName={user?.firstName} />
        </Box>
        <Box css={{ mb: "100px" }}>
          <UsageSummary />
        </Box>
        <Box css={{ mb: "$8" }}>
          <StreamsTable
            title="Streams"
            userId={user.id}
            pageSize={5}
            tableId="dashboardStreamsTable"
            viewAll="/dashboard/streams"
          />
        </Box>
      </Box>
    </Layout>
  );
};

export default Dashboard;
