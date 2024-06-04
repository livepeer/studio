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
import React, { useRef, useState } from "react";
import Image from "next/image";
import { useQuery, useQueryClient } from "react-query";
import { useProjectContext } from "context/ProjectContext";
import { useRouter } from "next/router";

const Settings = () => {
  useLoggedIn();
  const { user, getProject, deleteProject, updateProject } = useApi();
  const { projectId } = useProjectContext();

  const { data } = useQuery(
    ["project", projectId],
    () => getProject(projectId),
    {
      onSuccess(data) {
        setProjectName(data.name);
      },
    }
  );

  const [projectLogo, setProjectLogo] = useState<File | null>(null);
  const [projectName, setProjectName] = useState<string | null>();
  const logoRef = useRef<HTMLInputElement>(null);

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
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProject(projectId);
      alert("Project deleted successfully");
    }
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
            {!projectLogo ? (
              <Flex
                onClick={() => logoRef.current?.click()}
                justify={"center"}
                align="center"
                css={{
                  width: "90px",
                  height: "90px",
                  background: "$neutral3",
                  borderRadius: "$3",
                }}
              />
            ) : (
              <Image
                onClick={() => logoRef.current?.click()}
                src={URL.createObjectURL(projectLogo)}
                alt="Project logo"
                style={{
                  borderRadius: "12px",
                }}
                width={90}
                height={90}
              />
            )}
            <input
              type="file"
              accept="image/*"
              style={{
                display: "none",
              }}
              ref={logoRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setProjectLogo(file);
                }
              }}
            />
            <Text variant="neutral" size="3" css={{ mt: "$3" }}>
              Pick a logo for your project. Recommended size is 256x256px.
            </Text>
          </Flex>
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
              onClick={confirmDeleteProject}
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
      </Box>
    </Layout>
  );
};

export default Settings;
