import Layout from "layouts/dashboard";
import { useApi, useLoggedIn } from "hooks";
import { DashboardStreams as Content } from "content";
import {
  Box,
  Heading,
  Text,
  Grid,
  Button,
  Flex,
} from "@livepeer/design-system";
import ProjectTile from "components/Project/ProjectTile";
import { useQuery } from "react-query";
import { PlusIcon } from "@radix-ui/react-icons";

const WorkspaceProjects = () => {
  useLoggedIn();
  const { user } = useApi();

  const { getProjects } = useApi();
  const { data } = useQuery("projects", getProjects);

  if (!user) {
    return <Layout />;
  }

  return (
    <Layout
      id="account/projects"
      breadcrumbs={[{ title: "Projects" }]}
      {...Content.metaData}>
      <Box
        css={{
          pb: "$9",
          px: "$6",
          pt: "$6",
          "@bp4": {
            p: "$6",
          },
        }}>
        <Box css={{ mb: "$7" }}>
          <Flex
            justify={"between"}
            css={{
              borderBottom: "1px solid",
              borderColor: "$neutral6",
              pb: "$5",
              mb: "$5",
              width: "100%",
            }}>
            <Flex direction={"column"}>
              <Heading
                size="2"
                css={{
                  mr: "$3",
                  fontWeight: 600,
                  letterSpacing: "0",
                }}>
                Projects
              </Heading>
              <Text variant="neutral" size="3" css={{ mt: "$2" }}>
                Manage your projects
              </Text>
            </Flex>
            <Button
              css={{
                p: "$3",
                marginTop: "2rem",
              }}>
              <PlusIcon />{" "}
              <Box as="span" css={{ ml: "$2" }}>
                Create Project
              </Box>
            </Button>
          </Flex>
        </Box>
        <Grid
          css={{
            gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
            gap: "$5",
          }}>
          {data?.map((project) => (
            <ProjectTile
              id={project.id}
              name={project.name}
              // TODO: use the correct URL
              url={"https://example.com/projects/" + project.name}
            />
          ))}
        </Grid>
      </Box>
    </Layout>
  );
};

export default WorkspaceProjects;
