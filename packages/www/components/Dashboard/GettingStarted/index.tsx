import {
  Heading,
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Text,
  Button,
  Box,
} from "@livepeer.com/design-system";
import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";

const GettingStarted = ({ firstName = "" }) => {
  return (
    <>
      <Heading size="2" css={{ letterSpacing: "0", fontWeight: 600, mb: "$4" }}>
        Get started with Livepeer.com{firstName && `, ${firstName}`}
      </Heading>
      <Accordion type="single" defaultValue="accordion-one">
        <AccordionItem value="accordion-one">
          <AccordionButton css={{ color: "$mauve12" }}>
            <Text size="3" css={{ color: "inherit" }}>
              Create your first live stream
            </Text>
          </AccordionButton>
          <AccordionPanel>
            <Text
              variant="gray"
              size="3"
              css={{ mb: "$3", lineHeight: "23px" }}>
              Learn how to create a stream, broadcast live video content and
              playback your live stream with Livepeer.com. No code required.
            </Text>
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
                <Box css={{ mr: "$1" }}>Explore docs</Box>
                <ArrowRightIcon />
              </Button>
            </Link>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem value="accordion-two">
          <AccordionButton css={{ color: "$mauve12" }}>
            <Text size="3" css={{ color: "inherit" }}>
              Integrate with the API
            </Text>
          </AccordionButton>
          <AccordionPanel>
            <Text
              variant="gray"
              size="3"
              css={{ mb: "$3", lineHeight: "23px" }}>
              The Livepeer.com API is easy to use and customizable. The only
              prerequisite for using the API is creating an RTMP stream using
              open broadcaster software (OBS) such as OpenOBS, React Native Node
              Media Client, streamlabs or ffmpeg.
            </Text>
            <Link href="/docs/guides/api" passHref>
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
                <Box css={{ mr: "$1" }}>Explore API Docs</Box>
                <ArrowRightIcon />
              </Button>
            </Link>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem value="accordion-three">
          <AccordionButton css={{ color: "$mauve12" }}>
            <Text size="3" css={{ color: "inherit" }}>
              Create your first app
            </Text>
          </AccordionButton>
          <AccordionPanel>
            <Text
              variant="gray"
              size="3"
              css={{ mb: "$3", lineHeight: "23px" }}>
              The quickest and easiest way to create your first app using
              Livepeer.com is to fork an example app.
            </Text>
            <Link
              href="/docs/guides/using-livepeer-in-your-app/example-app"
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
                <Box css={{ mr: "$1" }}>Explore examples apps</Box>
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
