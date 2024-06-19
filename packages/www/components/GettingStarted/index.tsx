import {
  Heading,
  Accordion,
  AccordionTrigger,
  AccordionItem,
  AccordionContent,
  Text,
  Button,
  Box,
  Flex,
  Link as A,
  Paragraph,
  Card,
  Promo,
} from "@livepeer/design-system";
import Link from "next/link";
import { ArrowRightIcon, ArrowTopRightIcon } from "@radix-ui/react-icons";
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

const GettingStarted = ({ firstName = "" }) => {
  const { appendProjectId, projectId } = useProjectContext();
  const { getProject } = useApi();

  const { data } = useQuery([projectId], () => getProject(projectId));

  const SDKs = [
    {
      name: "React.js Components",
      description:
        "Integrate Livepeer Studio into your React application using our Livepeer Studio React SDK.",
      link: "/docs/sdk/react",
      image:
        "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg",
    },
    {
      name: "JavaScript SDK",
      description:
        "Integrate Livepeer Studio into your JavaScript application using our Livepeer Studio JavaScript SDK.",
      link: "/docs/sdk/javascript",
      image:
        "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg",
    },
    {
      name: "Python SDK",
      description:
        "Integrate Livepeer Studio into your Python application using our Livepeer Studio Python SDK.",
      link: "/docs/sdk/python",
      image:
        "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg",
    },

    {
      name: "Ruby SDK",
      description:
        "Integrate Livepeer Studio into your Ruby application using our Livepeer Studio Ruby SDK.",
      link: "/docs/sdk/ruby",
      image:
        "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ruby/ruby-original.svg",
    },
  ];

  return (
    <>
      <Flex
        justify={"between"}
        align={"center"}
        css={{
          mb: "$4",
        }}>
        <Heading size="2" css={{ letterSpacing: "0", fontWeight: 600 }}>
          {data?.name}
        </Heading>
        <Link href={appendProjectId("/settings")} passHref legacyBehavior>
          <Button as="a" size="2">
            Edit Project
          </Button>
        </Link>
      </Flex>
      <Box
        css={{
          bc: "$panel",
        }}>
        <Accordion
          placeholder="Getting Started"
          type="single"
          defaultValue="accordion-one">
          <AccordionItem value="accordion-one">
            <AccordionTrigger
              placeholder="upload video accordion"
              css={{ color: "$primary12" }}>
              <Text size="4" css={{ color: "inherit" }}>
                Upload your first video
              </Text>
            </AccordionTrigger>
            <AccordionContent>
              <Box>
                <Text
                  variant="neutral"
                  size="3"
                  css={{ mb: "$3", lineHeight: "23px" }}>
                  Upload a video asset for on-demand playback.
                </Text>
              </Box>
              <Flex align="center" gap={2}>
                <Link href={appendProjectId("/assets")} passHref legacyBehavior>
                  <Button
                    variant="primary"
                    css={{
                      display: "inline-flex",
                      cursor: "default",
                      ai: "center",
                    }}
                    size="2">
                    <Box css={{ mr: "$1" }}>Upload your first video</Box>
                  </Button>
                </Link>
                <Link
                  href="https://docs.livepeer.org/guides/developing/upload-a-video-asset"
                  passHref
                  legacyBehavior>
                  <Button
                    as="a"
                    target="_blank"
                    rel="noopener noreferrer"
                    css={{
                      display: "inline-flex",
                      cursor: "default",
                      ai: "center",
                    }}
                    size="2">
                    <Box css={{ mr: "$1" }}>See the developer guide</Box>
                    <ArrowTopRightIcon />
                  </Button>
                </Link>
              </Flex>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="accordion-two">
            <AccordionTrigger
              placeholder="Create your first livestream"
              css={{ color: "$primary12" }}>
              <Text size="4" css={{ color: "inherit" }}>
                Create your first livestream
              </Text>
            </AccordionTrigger>
            <AccordionContent>
              <Box>
                <Text
                  variant="neutral"
                  size="3"
                  css={{ mb: "$3", lineHeight: "23px" }}>
                  Generate a stream key to use in your favorite broadcasting
                  software.
                </Text>
              </Box>
              <Flex align="center" gap={2}>
                <Link
                  href={appendProjectId("/streams")}
                  passHref
                  legacyBehavior>
                  <Button
                    variant="primary"
                    css={{
                      display: "inline-flex",
                      cursor: "default",
                      ai: "center",
                    }}
                    size="2">
                    <Box css={{ mr: "$1" }}>Create your first livestream</Box>
                  </Button>
                </Link>
                <Link
                  href="https://docs.livepeer.org/guides/developing/create-a-livestream"
                  passHref
                  legacyBehavior>
                  <Button
                    as="a"
                    target="_blank"
                    rel="noopener noreferrer"
                    css={{
                      display: "inline-flex",
                      cursor: "default",
                      ai: "center",
                    }}
                    size="2">
                    <Box css={{ mr: "$1" }}>See the developer guide</Box>
                    <ArrowTopRightIcon />
                  </Button>
                </Link>
              </Flex>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="accordion-three">
            <AccordionTrigger
              placeholder="Integrate with your app"
              css={{ color: "$primary12" }}>
              <Text size="4" css={{ color: "inherit" }}>
                Integrate with your app
              </Text>
            </AccordionTrigger>
            <AccordionContent>
              <Text
                variant="neutral"
                size="3"
                css={{ mb: "$3", lineHeight: "23px" }}>
                Create an API key and start coding.
              </Text>
              <Flex align="center" gap={2}>
                <Link
                  href={appendProjectId("/developers/api-keys")}
                  passHref
                  legacyBehavior>
                  <Button
                    variant="primary"
                    css={{
                      display: "inline-flex",
                      cursor: "default",
                      ai: "center",
                    }}
                    size="2">
                    <Box css={{ mr: "$1" }}>Generate an API Key</Box>
                  </Button>
                </Link>
                <Link
                  href="https://docs.livepeer.org/guides/developing/quickstart"
                  passHref
                  legacyBehavior>
                  <Button
                    as="a"
                    target="_blank"
                    rel="noopener noreferrer"
                    css={{
                      display: "inline-flex",
                      cursor: "default",
                      ai: "center",
                    }}
                    size="2">
                    <Box css={{ mr: "$1" }}>See the developer guide</Box>
                    <ArrowTopRightIcon />
                  </Button>
                </Link>
              </Flex>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Box>

      <>
        <Box
          css={{
            mt: "$6",
            mb: "$3",
          }}>
          <Heading>Get started with Livepeer Studio</Heading>
        </Box>
        <Flex
          justify={"between"}
          wrap={"wrap"}
          css={{
            gap: "$4",
          }}>
          {SDKs.map((sdk) => (
            <Promo
              css={{
                width: "22%",
              }}>
              <Image
                style={{
                  borderRadius: 5,
                  marginBottom: 10,
                }}
                src={sdk.image}
                alt={sdk.name}
                width={26}
                height={26}
              />
              <Text size={"4"} css={{ fontWeight: 500 }}>
                {sdk.name}
              </Text>
              <Text
                variant="neutral"
                size="2"
                css={{
                  mt: "$1",
                  mb: "$1",
                }}>
                {sdk.description}
              </Text>
              <Button
                css={{
                  mt: "$2",
                  display: "flex",
                  width: "fit-content",
                  alignItems: "center",
                }}>
                See documentation <ArrowRightIcon />
              </Button>
            </Promo>
          ))}
        </Flex>
      </>
    </>
  );
};

export default GettingStarted;
