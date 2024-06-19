import Layout from "layouts/dashboard";
import { useApi, useLoggedIn } from "hooks";
import {
  Box,
  Heading,
  Flex,
  Text,
  TextField,
  Button,
} from "@livepeer/design-system";
import { DashboardSettingsGeneral as Content } from "content";
import React, { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { useProjectContext } from "context/ProjectContext";
import DeleteProjectDialog from "components/Project/deleteProjectDialog";
import { Project } from "@livepeer.studio/api";

const Settings = () => {
  useLoggedIn();
  const { user, getProject, deleteProject, updateProject } = useApi();
  const { projectId } = useProjectContext();
  const [open, setOpen] = useState(false);

  const { data } = useQuery([projectId], () => getProject(projectId), {
    onSuccess(data) {
      setProjectName(data.name);
    },
  });

  const [projectName, setProjectName] = useState<string | null>();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!projectName) {
      alert("Project name is required");
      return;
    }

    await updateProject(projectId, {
      name: projectName,
    });

    window.location.reload();
  };

  const confirmDeleteProject = () => {
    // if (confirm("Are you sure you want to delete this project?")) {
    //   deleteProject(projectId);
    //   alert("Project deleted successfully");
    // }
  };

  const invalidateProject = useCallback(
    (optimistic?: Project) => {
      if (optimistic) {
        queryClient.setQueryData([projectId], optimistic);
      }
      return queryClient.invalidateQueries([projectId]);
    },
    [queryClient, projectId]
  );

  const onOpenChange = (open: boolean) => {
    setOpen(open);
  };

  if (!user) {
    return <Layout />;
  }
  return (
    <Layout
      id="settings"
      breadcrumbs={[{ title: "Settings" }]}
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
              Settings
            </Heading>
            <Text variant="neutral" size="3" css={{ mt: "$2" }}>
              Manage your project settings
            </Text>
          </Box>
        </Box>
        <Box
          css={{
            mb: "$7",
            pb: "$7",
            // borderBottom: "1px solid",
            // borderColor: "$neutral6",
          }}>
          <Flex
            direction={"column"}
            css={{
              mb: "$4",
              mt: "$6",
            }}>
            <Box
              css={{
                fontWeight: 500,
                mb: "$3",
              }}>
              Project Name
            </Box>
            <TextField
              required
              size="2"
              type="text"
              onChange={(e) => setProjectName(e.target.value)}
              value={projectName}
              id="projectName"
              css={{
                width: "15rem",
              }}
              placeholder="Project Name"
            />
          </Flex>
          <Button
            onClick={handleSubmit}
            css={{
              p: "$4",
              fontSize: "$2",
              mt: "$3",
              backgroundColor: "$hiContrast",
              color: "$loContrast",
            }}>
            Update
          </Button>
        </Box>

        {/* 
          Commented out the delete project button for now as we are launching without this feature (for now)
          
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
              Delete Project
            </Box>
            <Text
              variant="neutral"
              size="3"
              css={{ mb: "$3", width: "30rem", lineHeight: 1.7 }}>
              If you want to permanently delete this project and all of its
              data, including but not limited to streams, sessions, and assets,
              you can do so below.
            </Text>
            <Button
              onClick={() => {
                setOpen(true);
              }}
              css={{
                p: "$4",
                fontSize: "$2",
                color: "white",
                mt: "$3",
                width: "10em",
                backgroundColor: "$red9",
              }}>
              Delete Project
            </Button>
          </Flex>
        </Box>
      */}
      </Box>
      <DeleteProjectDialog
        open={open}
        onOpenChange={onOpenChange}
        project={data}
        invalidate={invalidateProject}
      />
    </Layout>
  );
};

export default Settings;
