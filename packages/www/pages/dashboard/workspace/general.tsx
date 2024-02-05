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
} from "@livepeer/design-system";
import { workspaces } from "../settings";
import Image from "next/image";
import { sanitizeUrl } from "lib/url-sanitizer";

const WorkspaceGeneral = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user) {
    return <Layout />;
  }

  return (
    <Layout
      id="workspace/general"
      breadcrumbs={[
        { title: "Workspace", href: "/dashboard/workspace/general" },
        { title: "General" },
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
              Workspace
            </Heading>
            <Text variant="neutral" size="3" css={{ mt: "$2" }}>
              Manage your workspace settings
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
              width: "100%",
            }}>
            <Box
              css={{
                fontWeight: 500,
                mb: "$3",
              }}>
              Logo
            </Box>
            <Image
              src={workspaces[0].projects[0].logo}
              alt="Project logo"
              style={{
                borderRadius: "12px",
              }}
              width={90}
              height={90}
            />
            <Text variant="neutral" size="3" css={{ mt: "$3" }}>
              Pick a logo for your workspace. Recommended size is 256x256px.
            </Text>
          </Flex>
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
              }}>
              General
            </Box>
            <Box>
              <Text
                css={{
                  fontWeight: 500,
                  mb: "$3",
                }}>
                Workspace name
              </Text>
              <TextField
                required
                size="2"
                type="text"
                defaultValue={workspaces[0].name}
                id="workspaceName"
                css={{
                  width: "20%",
                }}
                placeholder="Workspace Name"
              />
            </Box>
            <Box>
              <Text
                css={{
                  fontWeight: 500,
                  mb: "$3",
                  mt: "$5",
                }}>
                Workspace URL
              </Text>
              <TextField
                required
                size="2"
                type="text"
                defaultValue={sanitizeUrl(workspaces[0].url)}
                id="workspaceURL"
                css={{
                  width: "20%",
                }}
                placeholder="Workspace URL"
              />
            </Box>
          </Flex>
          <Button
            css={{
              p: "$4",
              fontSize: "$2",
              mt: "$3",
              backgroundColor: "black",
              color: "white",
            }}>
            Update
          </Button>
        </Box>
        <Box>
          <Flex
            direction={"column"}
            css={{
              mb: "$4",
              width: "100%",
            }}>
            <Box
              css={{
                fontWeight: 500,
                mb: "$3",
                fontSize: "$5",
              }}>
              Delete Workspace
            </Box>
            <Text
              variant="neutral"
              size="3"
              css={{ mb: "$3", width: "40%", lineHeight: 1.7 }}>
              If you want to permanently delete this workspace and all of its
              data, including but not limited to streams, sessions, and assets,
              you can do so below.
            </Text>
            <Button
              css={{
                p: "$4",
                fontSize: "$2",
                color: "white",
                mt: "$3",
                width: "13%",
                backgroundColor: "$red9",
              }}>
              Delete this workspace
            </Button>
          </Flex>
        </Box>
      </Box>
    </Layout>
  );
};

export default WorkspaceGeneral;
