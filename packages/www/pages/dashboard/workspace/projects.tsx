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
import ProjectTile from "components/Project/ProjectTile";

const WorkspaceProjects = () => {
  useLoggedIn();
  const { user } = useApi();

  if (!user) {
    return <Layout />;
  }

  return (
    <Layout
      id="workspace/projects"
      breadcrumbs={[
        { title: "Workspace", href: "/dashboard/workspace/general" },
        { title: "Projects" },
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
              Projects
            </Heading>
            <Text variant="neutral" size="3" css={{ mt: "$2" }}>
              Manage your workspace projects
            </Text>
          </Box>
        </Box>
        {workspaces[0].projects.map((project) => (
          <ProjectTile
            name={project.name}
            logo={project.logo}
            url={project.url}
            activeStreams={project.activeStreams}
            inProgressUploads={project.inProgressUploads}
          />
        ))}
      </Box>
    </Layout>
  );
};

export default WorkspaceProjects;
