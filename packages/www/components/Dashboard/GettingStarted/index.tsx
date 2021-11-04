import {
  Heading,
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Text,
  Button,
  Box,
  Link as A,
} from "@livepeer.com/design-system";
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
          <AccordionButton css={{ color: "$mauve12" }}>
            <Text size="3" css={{ color: "inherit" }}>
              Create your first live stream
            </Text>
          </AccordionButton>
          <AccordionPanel>
            <Box>
              <Text
                variant="gray"
                size="3"
                css={{ mb: "$3", lineHeight: "23px" }}>
                No code required! All you need to do is create a RTMP stream
                with broadcasting software like{" "}
                <Link passHref href="https://obsproject.com/">
                  <A target="_blank">OBS Studio</A>
                </Link>{" "}
                or{" "}
                <Link passHref href="https://streamlabs.com/">
                  <A target="_blank">streamlabs</A>
                </Link>
                . Here’s how.
              </Text>
              <Text
                variant="gray"
                size="3"
                css={{ mb: "$3", lineHeight: "23px" }}>
                1. Tap <b>+ Create stream</b> below give your stream a name.
                <br />
                2. From the Stream Details, copy the Playback URL and Stream
                Key. <br />
                3. Then paste them into your broadcasting software. <br />
                4. Tap “Go Live” in the broadcasting software to start
                streaming.
              </Text>
              <Text
                variant="gray"
                size="3"
                css={{ mb: "$3", lineHeight: "23px" }}>
                Need more help? Read our step-by-step guide.
              </Text>
            </Box>
            <Link href="/docs/guides/start-live-streaming/tutorial" passHref>
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
                variant="violet">
                <Box css={{ mr: "$1" }}>Get started tutorial</Box>
                <ArrowRightIcon />
              </Button>
            </Link>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem value="accordion-two">
          <AccordionButton css={{ color: "$mauve12" }}>
            <Text size="3" css={{ color: "inherit" }}>
              Build with the Livepeer API
            </Text>
          </AccordionButton>
          <AccordionPanel>
            <Text
              variant="gray"
              size="3"
              css={{ mb: "$3", lineHeight: "23px" }}>
              Ready to code? The Livepeer API is nimble and designed for
              customization. All you need to do is create an RTMP stream with
              broadcasting software like{" "}
              <Link passHref href="https://obsproject.com/">
                <A target="_blank">OBS Studio</A>
              </Link>
              ,{" "}
              <Link passHref href="https://streamlabs.com/">
                <A target="_blank">streamlabs</A>
              </Link>
              , or{" "}
              <Link passHref href="https://ffmpeg.org/">
                <A target="_blank">ffmpeg</A>
              </Link>
              .
            </Text>
            <Link href="/docs/api-reference" passHref>
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
                variant="violet">
                <Box css={{ mr: "$1" }}>Explore the API</Box>
                <ArrowRightIcon />
              </Button>
            </Link>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem value="accordion-three">
          <AccordionButton css={{ color: "$mauve12" }}>
            <Text size="3" css={{ color: "inherit" }}>
              Create your own app
            </Text>
          </AccordionButton>
          <AccordionPanel>
            <Text
              variant="gray"
              size="3"
              css={{ mb: "$3", lineHeight: "23px" }}>
              Livepeer video infrastructure is designed to serve your app, from
              the ground up and at scale. Get started by reviewing and cloning
              one of our sample apps.
            </Text>
            <Link
              href="/docs/guides/application-development/example-app"
              passHref>
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
                variant="violet">
                <Box css={{ mr: "$1" }}>Clone and create</Box>
                <ArrowRightIcon />
              </Button>
            </Link>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </>
  );
};

export default GettingStarted;
