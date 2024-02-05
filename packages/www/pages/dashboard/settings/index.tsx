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
import { DashboardSettings as Content } from "content";
import React, { useRef, useState } from "react";
import Image from "next/image";

const Settings = () => {
  useLoggedIn();
  const { user } = useApi();
  const [projectName, setProjectName] = useState<string | null>(null);
  const [projectLogo, setProjectLogo] = useState<File | null>(null);

  // TODO: Replace with proper media upload once the API is ready
  const logoRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    console.log("Project Name: ", projectName);
    console.log("Project Logo: ", projectLogo);
  };

  if (!user) {
    return <Layout />;
  }
  return (
    <Layout
      id="settings"
      breadcrumbs={[{ title: "Settings" }]}
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
            <Image
              onClick={() => logoRef.current?.click()}
              src={
                projectLogo
                  ? URL.createObjectURL(projectLogo)
                  : workspaces[0].projects[0].logo
              }
              alt="Project logo"
              style={{
                borderRadius: "12px",
                cursor: "pointer",
              }}
              width={90}
              height={90}
            />
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
              width: "100%",
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
              defaultValue={workspaces[0].projects[0].name}
              onChange={(e) => setProjectName(e.target.value)}
              value={projectName}
              id="projectName"
              css={{
                width: "20%",
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
              Delete Project
            </Box>
            <Text
              variant="neutral"
              size="3"
              css={{ mb: "$3", width: "40%", lineHeight: 1.7 }}>
              If you want to permanently delete this project and all of its
              data, including but not limited to streams, sessions, and assets,
              you can do so below.
            </Text>
            <Button
              css={{
                p: "$4",
                fontSize: "$2",
                color: "white",
                mt: "$3",
                width: "10%",
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

// Placeholder constants, it will be removed and replaced with real data from the API
export const workspaces = [
  {
    name: "Paramount",
    logo: "https://pbs.twimg.com/profile_images/1712502841494138880/GofqA30R_400x400.jpg",
    url: "https://livepeer.studio/paramount",
    projects: [
      {
        name: "Paramount Plus",
        logo: "https://pbs.twimg.com/profile_images/1712502841494138880/GofqA30R_400x400.jpg",
        url: "https://livepeer.studio/paramount/paramount-plus",
        activeStreams: 10,
        inProgressUploads: 5,
      },
    ],
    members: [
      {
        name: "John Doe",
        email: "john@livepeer.org",
        role: "Admin",
      },
    ],
  },
];

export default Settings;
