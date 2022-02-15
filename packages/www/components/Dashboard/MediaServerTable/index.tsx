import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import {
  Flex,
  Heading,
  Link as A,
  Text,
  Box,
} from "@livepeer.com/design-system";

const MediaServerTable = ({ title = "Media Server" }: { title?: string }) => {
  return (
    <>
      <Heading size="2" css={{ fontWeight: 600 }}>
        {title}
      </Heading>
      <Flex
        direction="column"
        justify="center"
        css={{
          margin: "0 auto",
          height: "calc(100vh - 400px)",
          maxWidth: 450,
        }}>
        <Heading css={{ fontWeight: 500, mb: "$3" }}>
          Configurable, deployable, and open-source
        </Heading>
        <Text variant="gray" css={{ lineHeight: 1.5, mb: "$3" }}>
          Livepeer Media Server (MistServer) allows you to take any media from
          any location, using any method, and deliver it seamlessly to anyone,
          anywhere, in any format.
        </Text>

        <Box
          css={{
            display: "block",
            "@bp1": {
              display: "flex",
            },
          }}>
          <Link href="https://mistserver.org/" passHref>
            <A
              target="_blank"
              variant="violet"
              css={{ display: "flex", ai: "center", mb: "$5" }}>
              <Box>Learn more</Box>
              <ArrowRightIcon />
            </A>
          </Link>

          <Link href="https://mistserver.org/download" passHref>
            <A
              target="_blank"
              variant="violet"
              css={{
                display: "flex",
                ai: "center",
                mb: "$5",
                ml: "$0",
                "@bp1": {
                  ml: "$3",
                },
              }}>
              <Box>Downloads</Box>
              <ArrowRightIcon />
            </A>
          </Link>
        </Box>
      </Flex>
    </>
  );
};

export default MediaServerTable;
