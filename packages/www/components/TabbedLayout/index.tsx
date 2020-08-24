import { Box } from "@theme-ui/components";
import Layout from "../../components/Layout";
import { Button } from "@theme-ui/components";
import { Flex } from "@theme-ui/components";
import Tabs, { TabType } from "../../components/Tabs";
import { FunctionComponent } from "react";

type TabbedLayoutProps = {
  tabs: Array<TabType>;
  logout: Function;
};

const TabbedLayout: FunctionComponent<TabbedLayoutProps> = ({
  tabs,
  logout,
  children,
}) => {
  return (
    <Layout>
      <Flex
        sx={{
          flexDirection: "column",
          flexGrow: 1,
          alignItems: "center",
        }}
      >
        <Tabs tabs={tabs} />
        {children}
      </Flex>
    </Layout>
  );
};

export default TabbedLayout;
