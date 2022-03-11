import Link from "next/link";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import {
  Flex,
  Heading,
  Link as A,
  Text,
  Box,
} from "@livepeer.com/design-system";

const AssetsTable = ({
  title = "Video on Demand Assets",
}: {
  title?: string;
}) => {
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
          Video on Demand Assets
        </Heading>
        <Text variant="gray" css={{ lineHeight: 1.5, mb: "$3" }}>
          Livepeer now supports Video on Demand which allows you to import video
          assets, store them on decentralized storage, and easily mint a video
          NFT. This functionality is currently in beta and available only on the
          API.
        </Text>

        <Box
          css={{
            display: "block",
            "@bp1": {
              display: "flex",
            },
          }}>
          <Link href="/docs/api-reference/vod/import" passHref>
            <A
              target="_blank"
              variant="violet"
              css={{ display: "flex", ai: "center", mb: "$5" }}>
              <Box>Documentation</Box>
              <ArrowRightIcon />
            </A>
          </Link>
        </Box>
      </Flex>
    </>
  );
};

export default AssetsTable;
