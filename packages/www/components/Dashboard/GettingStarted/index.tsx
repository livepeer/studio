import {
  Heading,
  Accordion,
  AccordionTrigger,
  AccordionItem,
  AccordionContent,
  Text,
  Button,
  Box,
  Link as A,
} from "@livepeer/design-system";
import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";

const GettingStarted = ({ firstName = "" }) => {
  return (
    <>
      <Heading size="2" css={{ letterSpacing: "0", fontWeight: 600, mb: "$4" }}>
        Welcome to your dashboard{firstName && `, ${firstName}`}
      </Heading>
      <Accordion type="single" defaultValue="accordion-one">
        <AccordionItem value="accordion-one">
          <AccordionTrigger css={{ color: "$primary12" }}>
            <Text size="3" css={{ color: "inherit" }}>
              Create your first live stream
            </Text>
          </AccordionTrigger>
          <AccordionContent>
            <Box>
              <Text
                variant="gray"
                size="3"
                css={{ mb: "$3", lineHeight: "23px" }}>
                No code required! All you need to do is create a RTMP stream
                with broadcasting software like{" "}
                <Link passHref href="https://obsproject.com/" legacyBehavior>
                  <A target="_blank">OBS Studio</A>
                </Link>{" "}
                or{" "}
                <Link passHref href="https://streamlabs.com/" legacyBehavior>
                  <A target="_blank">streamlabs</A>
                </Link>
                . Here’s how:
              </Text>
              <Text
                variant="gray"
                size="3"
                css={{ mb: "$3", lineHeight: "23px" }}>
                1. Navigate to the streams view, tap "Create stream", and give
                your stream a name.
                <br />
                2. Copy the Playback URL and Stream Key in the stream detail
                view and paste them into your broadcasting software.
                <br />
                3. Tap "Go Live" in your broadcasting software to start
                streaming. <br />
              </Text>
              <Text
                variant="gray"
                size="3"
                css={{ mb: "$3", lineHeight: "23px" }}>
                Need more help? Read our step-by-step getting started tutorial.
              </Text>
            </Box>
            <Link
              href="https://docs.livepeer.studio/guides/live/create-a-livestream"
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
                size="2"
                variant="primary">
                <Box css={{ mr: "$1" }}>Getting started tutorial</Box>
                <ArrowRightIcon />
              </Button>
            </Link>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="accordion-two">
          <AccordionTrigger css={{ color: "$primary12" }}>
            <Text size="3" css={{ color: "inherit" }}>
              Upload your first video
            </Text>
          </AccordionTrigger>
          <AccordionContent>
            <Box>
              <Text
                variant="gray"
                size="3"
                css={{ mb: "$3", lineHeight: "23px" }}>
                Easily add video assets to your application for on demand
                playback. Navigate to the "Assets" view to get started.
              </Text>
              <Text
                variant="gray"
                size="3"
                css={{ mb: "$3", lineHeight: "23px" }}>
                Want to learn more?
              </Text>
            </Box>
            <Link
              href="https://docs.livepeer.studio/guides/on-demand/upload-video-asset/dashboard"
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
                size="2"
                variant="primary">
                <Box css={{ mr: "$1" }}>Check out our documentation</Box>
                <ArrowRightIcon />
              </Button>
            </Link>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="accordion-three">
          <AccordionTrigger css={{ color: "$primary12" }}>
            <Text size="3" css={{ color: "inherit" }}>
              Build with the API
            </Text>
          </AccordionTrigger>
          <AccordionContent>
            <Text
              variant="gray"
              size="3"
              css={{ mb: "$3", lineHeight: "23px" }}>
              Ready to code? The API is nimble and designed for customization.
              All you need to do is create an RTMP stream with broadcasting
              software like{" "}
              <Link passHref href="https://obsproject.com/" legacyBehavior>
                <A target="_blank">OBS Studio</A>
              </Link>
              ,{" "}
              <Link passHref href="https://streamlabs.com/" legacyBehavior>
                <A target="_blank">streamlabs</A>
              </Link>
              , or{" "}
              <Link passHref href="https://ffmpeg.org/" legacyBehavior>
                <A target="_blank">ffmpeg</A>
              </Link>
              .
            </Text>
            <Link
              href="https://docs.livepeer.studio/category/api"
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
                size="2"
                variant="primary">
                <Box css={{ mr: "$1" }}>Explore the API</Box>
                <ArrowRightIcon />
              </Button>
            </Link>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="accordion-four">
          <AccordionTrigger css={{ color: "$primary12" }}>
            <Text size="3" css={{ color: "inherit" }}>
              Create your own app
            </Text>
          </AccordionTrigger>
          <AccordionContent>
            <Text
              variant="gray"
              size="3"
              css={{ mb: "$3", lineHeight: "23px" }}>
              Livepeer Studio is designed to serve your app, from the ground up
              and at scale. Get started by reviewing and cloning one of our
              sample apps.
            </Text>
            <Link
              href="https://docs.livepeer.studio/reference/examples"
              passHref
              legacyBehavior>
              <Button
                as="a"
                target="_blank"
                rel="noopener noreferrer"
                css={{
                  cursor: "default",
                  display: "inline-flex",
                  ai: "center",
                }}
                size="2"
                variant="primary">
                <Box css={{ mr: "$1" }}>Clone and create</Box>
                <ArrowRightIcon />
              </Button>
            </Link>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
};

export default GettingStarted;
