import Layout from "layouts/dashboard";
import { useApi, useLoggedIn } from "hooks";
import { DashboardProjects as Content } from "content";
import { Box, Heading, Grid } from "@livepeer/design-system";
import { Flex } from "components/ui/flex";
import { Button } from "components/ui/button";
import { Text } from "components/ui/text";
import ProjectTile from "components/Project/ProjectTile";
import { useQuery, useQueryClient } from "react-query";
import { PlusIcon } from "@radix-ui/react-icons";
import { useCallback, useState } from "react";
import CreateProjectDialog from "components/Project/createProjectDialog";
import { useProjectContext } from "context/ProjectContext";
import Link from "next/link";
import FeaturesModel from "components/FeaturesModel";

const WorkspaceProjects = () => {
  useLoggedIn();
  const { user, getProjects, createProject } = useApi();
  const [showCreateProjectAlert, setShowCreateProjectAlert] = useState(false);
  const { setProjectId } = useProjectContext();

  const queryClient = useQueryClient();

  const onCreateClick = async (projectName: string) => {
    const project = await createProject({
      name: projectName,
    });

    setProjectId(project.id);
    setShowCreateProjectAlert(false);

    invalidateQuery();
  };

  const invalidateQuery = useCallback(() => {
    queryClient.invalidateQueries("projects");
    return true;
  }, [queryClient]);

  const { data } = useQuery("projects", getProjects);

  if (!user) {
    return <Layout />;
  }

  return (
    <Layout
      id="settings/projects"
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
        <Box css={{ mb: "$6" }}>
          <Flex className="justify-between flex-col md:flex-row border-b border-accent pb-5 gap-4 w-full">
            <Flex className="flex-col">
              <Heading
                size="2"
                css={{
                  mr: "$3",
                  fontWeight: 600,
                  letterSpacing: "0",
                }}>
                Projects
              </Heading>
              <Text variant="neutral" size="sm" className="mt-2">
                Manage your projects
              </Text>
            </Flex>
            <Button
              variant="secondary"
              onClick={() => setShowCreateProjectAlert(true)}>
              <PlusIcon />{" "}
              <Text size="sm" className="ml-2">
                Create project
              </Text>
            </Button>
          </Flex>
        </Box>
        <Grid className="grid-cols-1 md:grid-cols-2 gap-5">
          {data?.map((project, i) => (
            <Link
              style={{
                textDecoration: "none",
              }}
              passHref
              href={`/projects/${project.id}/`}>
              <ProjectTile
                key={`project-tile-${i}`}
                invalidateQuery={invalidateQuery}
                id={project.id}
                name={project?.name}
              />
            </Link>
          ))}
        </Grid>
      </Box>

      <CreateProjectDialog
        onCreate={onCreateClick}
        onOpenChange={(isOpen) => setShowCreateProjectAlert(isOpen)}
        isOpen={showCreateProjectAlert}
      />

      <FeaturesModel />
    </Layout>
  );
};

export default WorkspaceProjects;
