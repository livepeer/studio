import {
  Button,
  Box,
  Flex,
  Link as A,
  Paragraph,
  Promo,
  Code,
  Grid,
  useSnackbar,
  Avatar,
  HoverCardRoot,
  HoverCardContent,
  HoverCardTrigger,
} from "@livepeer/design-system";
import Link from "next/link";
import { ArrowRightIcon, CopyIcon } from "@radix-ui/react-icons";
import { useProjectContext } from "context/ProjectContext";
import { useQuery } from "react-query";
import { useApi } from "hooks";
import Image from "next/image";
import {
  AssetsIcon,
  StreamIcon,
  TerminalIcon,
  UsageIcon,
} from "components/Sidebar/NavIcons";
import { getEmojiIcon } from "lib/get-emoji";
import { useTheme } from "next-themes";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Text } from "components/ui/text";

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
      icon: <AssetsIcon size={"24"} />,
      action: "Upload Video",
    },
    {
      name: "Create a live stream",
      description:
        "Generate a stream key to use in your favorite broadcasting software.",
      link: appendProjectId("/streams"),
      icon: <StreamIcon size={"24"} />,
      action: "Create Stream",
    },
    {
      name: "Understand your usage",
      description: "Browse through your account usage and billing data.",
      link: "/settings/usage",
      icon: <UsageIcon size={"24"} />,
      action: "View Usage",
    },
    {
      name: "Create a webhook",
      description:
        "Set up a webhook to receive notifications about your video events.",
      link: appendProjectId("/developers/webhooks"),
      icon: <TerminalIcon size={"24"} />,
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
          <Text size="xl" weight="semibold">
            {data?.name}
          </Text>
        </Flex>
        <Link href={appendProjectId("/settings")} passHref legacyBehavior>
          <Button as="a" size="2">
            Edit Project
          </Button>
        </Link>
      </Flex>
      <Grid
        css={{
          width: "100%",
          gap: "$5",
          gridTemplateColumns: "repeat(auto-fill, minmax(23%, 1fr))",
        }}>
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
          <Text size="xl">Get started with Livepeer Studio</Text>
        </Box>
        <Grid
          css={{
            width: "100%",
            gap: "$5",
            gridTemplateColumns: "repeat(auto-fill, minmax(46%, 1fr))",
          }}>
          <Promo
            css={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}>
            <Box>
              <TerminalIcon size={"24"} />
              <Text size="xl" weight="semibold" className="mt-2">
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
              <Button
                css={{
                  mt: "$2",
                  display: "flex",
                  width: "fit-content",
                  alignItems: "center",
                }}>
                Visit documentation <ArrowRightIcon />
              </Button>
            </Link>
          </Promo>
          <Grid
            css={{
              display: "grid",
              width: "100%",
              height: "100%",
              gap: "$5",
              gridTemplateColumns: "repeat(2, 1fr)",
            }}>
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
    <Promo
      css={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}>
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
        <Text size="lg" weight="semibold" className="mt-2">
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
        <Button
          css={{
            mt: "$2",
            display: "flex",
            width: "fit-content",
            alignItems: "center",
          }}>
          {action}{" "}
          <ArrowRightIcon
            style={{
              marginLeft: "10px",
            }}
          />
        </Button>
      </Link>
    </Promo>
  );
};

export default GettingStarted;
