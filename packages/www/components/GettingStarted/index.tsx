import {
  Heading,
  Box,
  Flex,
  Link as A,
  Paragraph,
  Code,
  useSnackbar,
  Avatar,
  HoverCardRoot,
  HoverCardContent,
  HoverCardTrigger,
} from "@livepeer/design-system";
import { Grid } from "components/ui/grid";
import { Button } from "components/ui/button";
import { Text } from "components/ui/text";
import Link from "next/link";
import { ArrowRightIcon, CopyIcon } from "@radix-ui/react-icons";
import { useProjectContext } from "context/ProjectContext";
import { useQuery } from "react-query";
import { useApi } from "hooks";
import Image from "next/image";

import { getEmojiIcon } from "lib/get-emoji";
import { useTheme } from "next-themes";
import { CopyToClipboard } from "react-copy-to-clipboard";
import {
  CameraIcon,
  CircleGauge,
  FileVideoIcon,
  TerminalIcon,
  VideoIcon,
} from "lucide-react";

const GettingStarted = () => {
  const { appendProjectId, projectId } = useProjectContext();
  const { getProject } = useApi();
  const { resolvedTheme } = useTheme();

  const { data } = useQuery([projectId], () => getProject(projectId));

  const [openSnackbar] = useSnackbar();

  const GettingStartedCard = [
    {
      name: "Upload your first video",
      description: "Upload your first video asset for on-demand playback.",
      link: appendProjectId("/assets"),
      icon: (
        <FileVideoIcon
          strokeWidth={1}
          className="w-7 h-7 text-muted-foreground"
        />
      ),
      action: "Upload Video",
    },
    {
      name: "Create a live stream",
      description:
        "Generate a stream key to use in your favorite broadcasting software.",
      link: appendProjectId("/streams"),
      icon: (
        <CameraIcon strokeWidth={1} className="w-7 h-7 text-muted-foreground" />
      ),
      action: "Create Stream",
    },
    {
      name: "Understand your usage",
      description: "Browse through your account usage and billing data.",
      link: "/settings/usage",
      icon: (
        <CircleGauge
          strokeWidth={1}
          className="w-7 h-7 text-muted-foreground"
        />
      ),
      action: "View Usage",
    },
    {
      name: "Create a webhook",
      description:
        "Set up a webhook to receive notifications about your video events.",
      link: appendProjectId("/developers/webhooks"),
      icon: (
        <TerminalIcon
          strokeWidth={1}
          className="w-7 h-7 text-muted-foreground"
        />
      ),
      action: "Create Webhook",
    },
  ];

  const SDKs = [
    {
      name: "React.js Components",
      description:
        "Add video functionality to your React application using our React SDK.",
      link: "https://docs.livepeer.org/sdks/react/getting-started",
      image: "/dashboard/react.svg",
      action: "Visit Documentation",
    },
    {
      name: "JavaScript SDK",
      description:
        "Add video functionality to your JavaScript application using our JavaScript SDK.",
      link: "https://docs.livepeer.org/sdks/javascript",
      image: "/dashboard/javascript.svg",
      action: "Visit Documentation",
    },
    {
      name: "Python SDK",
      description:
        "Add video functionality to your Python application using our Python SDK.",
      link: "https://docs.livepeer.org/sdks/python",
      image: "/dashboard/python.svg",
      action: "Visit Documentation",
    },
    {
      name: "Golang SDK",
      description:
        "Add video functionality to your Golang application using our Golang SDK.",
      link: "https://docs.livepeer.org/sdks/go",
      image: "/dashboard/golang.svg",
      action: "Visit Documentation",
    },
  ];

  const codeExample = `
curl --request POST \
  --url https://livepeer.studio/api/stream \
  --header 'Authorization: Bearer <API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
  "name": "my first stream"
}'
  `;

  return (
    <>
      <Flex
        justify={"between"}
        align={"center"}
        css={{
          mb: "$5",
        }}>
        <Flex align={"center"}>
          <Avatar
            fallback={getEmojiIcon(data?.name)}
            style={{
              borderRadius: 10,
              marginRight: 10,
            }}
            size={"3"}
          />
          <Heading size="2" css={{ fontWeight: 600 }}>
            {data?.name}
          </Heading>
        </Flex>
        <Link href={appendProjectId("/settings")} passHref legacyBehavior>
          <Button variant="secondary" size="sm">
            Edit Project
          </Button>
        </Link>
      </Flex>
      <Grid className="grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {GettingStartedCard.map((sdk) => (
          <Card key={sdk.name} {...sdk} />
        ))}
      </Grid>
      <>
        <Box
          css={{
            mt: "$6",
            mb: "$3",
          }}>
          <Heading>Get started with Livepeer Studio</Heading>
        </Box>
        <Grid className="grid-cols-1 gap-5 lg:grid-cols-2">
          <Box className="w-full h-full flex bg-background border border-input flex-col justify-between p-4 rounded-lg">
            <Box>
              <TerminalIcon
                strokeWidth={1}
                className="w-7 h-7 text-muted-foreground"
              />
              <Text size="lg" className="mt-2" weight="semibold">
                Integrate with your app
              </Text>
              <Text variant="neutral" size="sm" className="mt-1 mb-1">
                Get your API key and start coding your next video application.
              </Text>
              <HoverCardRoot openDelay={200}>
                <HoverCardTrigger>
                  <Flex>
                    <CopyToClipboard
                      text={codeExample}
                      onCopy={() => openSnackbar("Copied to clipboard")}>
                      <img
                        src={
                          resolvedTheme === "light"
                            ? "/dashboard/code-example-light.png"
                            : "/dashboard/code-example-dark.png"
                        }
                        alt="Code example"
                        style={{
                          marginBottom: 10,
                          marginTop: 7,
                          width: "100%",
                        }}
                      />
                    </CopyToClipboard>
                  </Flex>
                </HoverCardTrigger>
                <HoverCardContent>
                  <Text
                    variant="neutral"
                    css={{
                      backgroundColor: "$panel",
                      borderRadius: 6,
                      px: "$3",
                      py: "$1",
                      fontSize: "$1",
                      display: "flex",
                      ai: "center",
                    }}>
                    <CopyIcon /> <Box css={{ ml: "$2" }}>Click to copy</Box>
                  </Text>
                </HoverCardContent>
              </HoverCardRoot>
            </Box>
            <Link
              style={{
                textDecoration: "none",
              }}
              href={
                "https://docs.livepeer.org/api-reference/overview/introduction"
              }>
              <Button variant="outline" size="sm" className="mt-2">
                Visit documentation <ArrowRightIcon />
              </Button>
            </Link>
          </Box>
          <Grid className="grid-cols-1 md:grid-cols-2 gap-5">
            {SDKs.map((sdk) => (
              <Box key={sdk.name}>
                <Card key={sdk.name} {...sdk} />
              </Box>
            ))}
          </Grid>
        </Grid>
      </>
    </>
  );
};

const Card = ({
  name,
  description,
  action,
  image,
  icon,
  link,
}: {
  name: string;
  description: string;
  action: string;
  image?: string;
  icon?: any;
  link: string;
}) => {
  return (
    <Box className="w-full h-full flex bg-background flex-col justify-between p-4 rounded-lg border border-input">
      <Box>
        {icon ? (
          <Box>{icon}</Box>
        ) : (
          <Image
            style={{
              borderRadius: 5,
            }}
            src={image}
            alt={name}
            width={26}
            height={26}
          />
        )}
        <Text size="lg" className="mt-2" weight="semibold">
          {name}
        </Text>
        <Text variant="neutral" size="sm" className="mt-1 mb-1">
          {description}
        </Text>
      </Box>
      <Link
        href={link}
        style={{
          textDecoration: "none",
        }}>
        <Button variant="outline" size="sm" className="mt-2">
          {action}{" "}
          <ArrowRightIcon
            style={{
              marginLeft: "10px",
            }}
          />
        </Button>
      </Link>
    </Box>
  );
};

export default GettingStarted;
