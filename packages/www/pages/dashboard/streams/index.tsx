import Layout from "layouts/dashboard";
import { useApi, useLoggedIn } from "hooks";
import StreamsTable from "components/StreamsTable";
import { DashboardStreams as Content } from "content";
import Ripe, { categories, pages } from "lib/ripe";
import {
  Box,
  Heading,
  Tabs,
  Text,
  TabsTrigger,
  TabsList,
  TabLink,
  TabsContent,
  Flex,
  Button,
} from "@livepeer/design-system";
import SessionsTable from "components/StreamDetails/SessionsTable";
import StreamSessionsTable from "components/StreamSessionsTable";
import { useState } from "react";
import { PlusCircledIcon, PlusIcon } from "@radix-ui/react-icons";

Ripe.trackPage({
  category: categories.DASHBOARD,
  name: pages.STREAMS,
});

const Streams = () => {
  useLoggedIn();
  const { user } = useApi();
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "unhealthy"
  >("all");

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
      id="streams"
      breadcrumbs={[{ title: "Streams" }]}
      {...Content.metaData}>
      <Box css={{ p: "$6", pl: 0 }}>
        <Box css={{ mb: "$7" }}>
          <Flex
            justify={"between"}
            css={{
              mb: "$2",
              width: "100%",
            }}>
            <Heading
              size="2"
              css={{
                mr: "$3",
                fontWeight: 600,
                letterSpacing: "0",
              }}>
              Streams
            </Heading>
            <Button
              css={{
                p: "$4",
                fontSize: "$2",
                backgroundColor: "black",
                color: "white",
              }}>
              <PlusIcon
                style={{
                  marginRight: "7px",
                }}
              />
              Create Stream
            </Button>
          </Flex>

          <Tabs className="TabsRoot" defaultValue="streams">
            <TabsList
              css={{
                borderBottom: "1px solid",
                borderColor: "$neutral8",
                mt: "$4",
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
              <TT key={`streams`} value={`streams`} title={"All streams"} />
              <TT key={`sessions`} value={`sessions`} title={"All sessions"} />
            </TabsList>
            <TabsContent value="streams">
              <Flex
                css={{
                  mt: "$4",
                  gap: "$3",
                }}>
                <Box
                  onClick={() => setActiveFilter("all")}
                  css={{
                    px: "$3",
                    py: "$2",
                    height: "100%",
                    border: activeFilter === "all" ? "2px solid" : "1px solid",
                    borderColor:
                      activeFilter === "all" ? "$blue11" : "$neutral8",
                    width: "20%",
                    borderRadius: "$3",
                  }}>
                  <Text
                    css={{
                      fontSize: "$4",
                      fontWeight: activeFilter === "all" ? 500 : 400,
                      mb: "$1",
                      color: activeFilter === "all" ? "$blue11" : "$neutral9",
                    }}>
                    All
                  </Text>
                  <Text
                    css={{
                      fontWeight: 500,
                      fontSize: "$4",
                      color: activeFilter === "all" && "$blue11",
                    }}>
                    255
                  </Text>
                </Box>
                <Box
                  onClick={() => setActiveFilter("active")}
                  css={{
                    px: "$3",
                    py: "$2",
                    height: "100%",
                    border:
                      activeFilter === "active" ? "2px solid" : "1px solid",
                    borderColor:
                      activeFilter === "active" ? "$blue11" : "$neutral8",
                    width: "20%",
                    borderRadius: "$3",
                  }}>
                  <Text
                    css={{
                      fontSize: "$4",
                      fontWeight: activeFilter === "active" ? 500 : 400,
                      mb: "$1",
                      color:
                        activeFilter === "active" ? "$blue11" : "$neutral9",
                    }}>
                    Active
                  </Text>
                  <Text
                    css={{
                      fontWeight: 500,
                      fontSize: "$4",
                      color: activeFilter === "active" && "$blue11",
                    }}>
                    5
                  </Text>
                </Box>
                <Box
                  onClick={() => setActiveFilter("unhealthy")}
                  css={{
                    px: "$3",
                    py: "$2",
                    height: "100%",
                    border:
                      activeFilter === "unhealthy" ? "2px solid" : "1px solid",
                    borderColor:
                      activeFilter === "unhealthy" ? "$blue11" : "$neutral8",
                    width: "20%",
                    borderRadius: "$3",
                  }}>
                  <Text
                    css={{
                      fontSize: "$4",
                      fontWeight: activeFilter === "unhealthy" ? 500 : 400,
                      mb: "$1",
                      color:
                        activeFilter === "unhealthy" ? "$blue11" : "$neutral9",
                    }}>
                    Unhealthy
                  </Text>
                  <Text
                    css={{
                      fontWeight: 500,
                      fontSize: "$4",
                      color: activeFilter === "unhealthy" && "$blue11",
                    }}>
                    1
                  </Text>
                </Box>
              </Flex>
              <Flex
                css={{
                  mt: "$4",
                  gap: "$3",
                }}
                direction={"row"}>
                <Flex
                  align={"center"}
                  gap={2}
                  css={{
                    p: "$1",
                    px: "$3",
                    border: "1px dashed",
                    borderRadius: "20px",
                    borderColor: "$neutral8",
                    color: "$neutral9",
                  }}>
                  <PlusCircledIcon />
                  Date Created
                </Flex>
                <Flex
                  align={"center"}
                  gap={2}
                  css={{
                    p: "$1",
                    px: "$3",
                    border: "1px dashed",
                    borderRadius: "20px",
                    borderColor: "$neutral8",
                    color: "$neutral9",
                  }}>
                  <PlusCircledIcon />
                  Name
                </Flex>
                <Flex
                  align={"center"}
                  gap={2}
                  css={{
                    p: "$1",
                    px: "$3",
                    border: "1px dashed",
                    borderRadius: "20px",
                    borderColor: "$neutral8",
                    color: "$neutral9",
                  }}>
                  <PlusCircledIcon />
                  Views
                </Flex>
                <Flex
                  align={"center"}
                  gap={2}
                  css={{
                    p: "$1",
                    px: "$3",
                    border: "1px dashed",
                    borderRadius: "20px",
                    borderColor: "$neutral8",
                    color: "$neutral9",
                  }}>
                  <PlusCircledIcon />
                  Minutes delivered
                </Flex>
                <Flex
                  align={"center"}
                  gap={2}
                  css={{
                    p: "$1",
                    px: "$3",
                    border: "1px dashed",
                    borderRadius: "20px",
                    borderColor: "$neutral8",
                    color: "$neutral9",
                  }}>
                  <PlusCircledIcon />
                  Minutes transcoded
                </Flex>
              </Flex>
              <StreamsTable
                title=""
                userId={user.id}
                pageSize={5}
                tableId="dashboardStreamsTable"
                viewAll="/dashboard/streams"
              />
            </TabsContent>
            <TabsContent value="sessions">
              <StreamSessionsTable title="" />
            </TabsContent>
          </Tabs>
        </Box>
      </Box>
    </Layout>
  );
};

export default Streams;
