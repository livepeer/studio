import Layout from "../../layouts/dashboard";
import {
  styled,
  Box,
  Flex,
  Button,
  Promo,
  Text,
  IconButton,
} from "@livepeer.com/design-system";
import GettingStarted from "@components/Dashboard/GettingStarted";
import UsageSummary from "@components/Dashboard/UsageSummary";
import StreamsTable from "@components/Dashboard/StreamsTable";
import SessionsTable from "@components/Dashboard/SessionsTable";
import { useLoggedIn, useApi } from "hooks";
import { Stream } from "@livepeer.com/api";
import { Cross1Icon } from "@radix-ui/react-icons";
import InfoIcon from "../../public/img/icons/info.svg";

const StyledCross1Icon = styled(Cross1Icon, {
  color: "$hiContrast",
});

const StyledInfoIcon = styled(InfoIcon, {
  color: "$slate800",
  mr: "$2",
});

const Dashboard = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user || user.emailValid === false) {
    return <Layout />;
  }

  return (
    <Layout>
      <Box css={{ p: "$6" }}>
        <Promo size="2" css={{ mb: "$7" }}>
          <Flex>
            <StyledInfoIcon />
            <Box>
              <Text size="2" css={{ mb: "$1", fontWeight: 500 }}>
                Upgrade to Pro
              </Text>
              <Text size="2" css={{ lineHeight: 1.4, color: "$slate900" }}>
                Upgrade to the Pro plan and enjoy unlimited transcoding and
                streaming minutes.
              </Text>
            </Box>
          </Flex>
          <Flex align="center" justify="end">
            <Button css={{ mr: "$3" }}>Upgrade to Pro</Button>
            <IconButton
              variant="ghost"
              css={{
                mixBlendMode: "initial",
              }}>
              <StyledCross1Icon />
            </IconButton>
          </Flex>
        </Promo>
        <Box css={{ mb: "$8" }}>
          <GettingStarted />
        </Box>
        <Box css={{ mb: "$9" }}>
          <UsageSummary />
        </Box>
        <Box css={{ mb: "$8" }}>
          <StreamsTable id="Streams Table" userId={user.id} />
        </Box>
        <Box css={{ mb: "$8" }}>
          {/* <SessionsTable streamId={stream.id} /> */}
        </Box>
      </Box>
    </Layout>
  );
};

export default Dashboard;
