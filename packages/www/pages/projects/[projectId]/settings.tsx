import Layout from "layouts/dashboard";
import { useApi, useLoggedIn } from "hooks";
import { Box, Heading, Flex } from "@livepeer/design-system";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Text } from "components/ui/text";
import { DashboardSettingsGeneral as Content } from "content";
import React, { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { useProjectContext } from "context/ProjectContext";
import Spinner from "components/Spinner";

const Settings = () => {
  useLoggedIn();
  const { user, getProject, updateProject } = useApi();
  const { projectId } = useProjectContext();
  const [isLoading, setIsLoading] = useState(false);

  const { data } = useQuery([projectId], () => getProject(projectId), {
    onSuccess(data) {
      setProjectName(data.name);
    },
  });

  const [projectName, setProjectName] = useState<string | null>();
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    setIsLoading(true);

    await updateProject(projectId, {
      name: projectName,
    });

    invalidateQuery();
    setIsLoading(false);
  };

  const invalidateQuery = useCallback(() => {
    return queryClient.invalidateQueries("projects");
  }, [queryClient]);

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
            <Text size="xl" weight="medium">
              Settings
            </Text>
            <Text variant="neutral" className="mt-2" size="sm">
              Manage your project settings
            </Text>
          </Box>
        </Box>
        <Box
          css={{
            mb: "$7",
            pb: "$7",
          }}>
          <Flex
            direction={"column"}
            css={{
              mb: "$4",
              mt: "$6",
            }}>
            <Text weight="medium" className="mb-3">
              Project Name
            </Text>
            <Input
              required
              type="text"
              onChange={(e) => setProjectName(e.target.value)}
              value={projectName}
              defaultValue={data?.name}
              id="projectName"
              className="max-w-md"
              placeholder="Project Name"
            />
          </Flex>
          <Button
            className="mt-3"
            onClick={handleSubmit}
            disabled={isLoading || !projectName}>
            {isLoading && (
              <Spinner
                css={{
                  color: "$hiContrast",
                  width: 16,
                  height: 16,
                  mr: "$2",
                }}
              />
            )}
            Update
          </Button>
        </Box>
      </Box>
    </Layout>
  );
};

export default Settings;
