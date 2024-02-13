import Layout from "layouts/dashboard";
import { useApi, useLoggedIn } from "hooks";
import { DashboardStreams as Content } from "content";
import {
  Box,
  Heading,
  Flex,
  Text,
  TextField,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@livepeer/design-system";
import { workspaces } from "../settings";
import { ChevronDownIcon } from "@radix-ui/react-icons";

const WorkspaceMembers = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user) {
    return <Layout />;
  }

  return (
    <Layout
      id="workspace/members"
      breadcrumbs={[
        { title: "Workspace", href: "/dashboard/workspace/general" },
        { title: "Members" },
      ]}
      {...Content.metaData}>
      <Box css={{ p: "$6", pl: 0 }}>
        <Box css={{ mb: "$7" }}>
          <Box
            css={{
              borderBottom: "1px solid",
              borderColor: "$neutral6",
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
              Members
            </Heading>
            <Text variant="neutral" size="3" css={{ mt: "$2" }}>
              Manage who has access to this workspace
            </Text>
          </Box>
        </Box>
        <Box
          css={{
            mb: "$9",
            pb: "$8",
            borderBottom: "1px solid",
            borderColor: "$neutral6",
          }}>
          <Flex
            direction={"column"}
            css={{
              mb: "$4",
              mt: "$6",
              width: "100%",
            }}>
            <Box
              css={{
                fontWeight: 500,
                mb: "$5",
                fontSize: "$4",
              }}>
              Manage members
              <Text variant="neutral" size="3" css={{ mt: "$2" }}>
                Mange workspace members and their permissions
              </Text>
            </Box>
            <Flex
              css={{
                gap: "$2",
              }}
              direction={"row"}>
              <TextField
                required
                size="2"
                type="text"
                id="workspaceName"
                css={{
                  width: "20%",
                }}
                placeholder="Search by name or email"
              />
              <Button
                css={{
                  p: "17px",
                  px: "$2",
                  fontSize: "$2",
                  backgroundColor: "transparent",
                  border: "1px solid",
                  ai: "center",
                  fontWeight: 400,
                  borderColor: "$neutral7",
                  color: "$neutral12",
                }}>
                All{" "}
                <Box
                  css={{
                    ml: "$1",
                  }}>
                  <ChevronDownIcon />
                </Box>
              </Button>
              <Button
                css={{
                  p: "17px",
                  ml: "$3",
                  fontSize: "$2",
                  backgroundColor: "black",
                  color: "white",
                }}>
                Invite
              </Button>
            </Flex>
            <Box
              css={{
                mt: "$4",
              }}>
              <Text
                css={{
                  fontWeight: 500,
                  color: "$neutral9",
                }}>
                {workspaces[0].members.length} members
              </Text>
            </Box>
          </Flex>
        </Box>
      </Box>
    </Layout>
  );
};

export default WorkspaceMembers;
