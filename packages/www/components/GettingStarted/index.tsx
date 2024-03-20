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
} from "@livepeer/design-system";
import Link from "next/link";
import { ArrowRightIcon, ArrowTopRightIcon } from "@radix-ui/react-icons";
import { getBrandName } from "lib/utils";

const GettingStarted = ({ firstName = "" }) => {
  return (
    <>
      <Heading size="2" css={{ letterSpacing: "0", fontWeight: 600, mb: "$4" }}>
        Welcome to {getBrandName()}
        {firstName && `, ${firstName}`}
      </Heading>
      <Box css={{ bc: "$panel" }}>
        <Accordion type="single" defaultValue="accordion-one">
          <AccordionItem value="accordion-one">
            <AccordionTrigger css={{ color: "$primary12" }}>
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
                <Link href="/dashboard/assets" passHref legacyBehavior>
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
            <AccordionTrigger css={{ color: "$primary12" }}>
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
                <Link href="/dashboard/streams" passHref legacyBehavior>
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
            <AccordionTrigger css={{ color: "$primary12" }}>
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
                  href="dashboard/developers/api-keys"
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
    </>
  );
};

export default GettingStarted;
