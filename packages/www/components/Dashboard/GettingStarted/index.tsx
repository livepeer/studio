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
            <Text size="3" css={{ mb: "$2", lineHeight: "23px" }}>
              Learn how to create a unique stream object, broadcast live video
              content and playback your live stream with Livepeer.com.
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
            <Text size="3" css={{ mb: "$2", lineHeight: "23px" }}>
              Learn how to work with Livepeer.com's API through http requests.
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
                <Box css={{ mr: "$1" }}>Explore API</Box>
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
            <Text size="3" css={{ mb: "$2", lineHeight: "23px" }}>
              Learn how to create livestreaming apps by viewing and forking
              example apps.
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
                <Box css={{ mr: "$1" }}>Explore examples</Box>
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
