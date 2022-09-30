import {
  Flex,
  Heading,
  Box,
  Button,
  Link as A,
  Text,
} from "@livepeer/design-system";
import { ArrowRightIcon, PlusIcon } from "@radix-ui/react-icons";
import { ToggleState } from "hooks/use-toggle-state";
import Link from "next/link";

const EmptyState = ({
  createDialogState,
}: {
  createDialogState: ToggleState;
}) => {
  return (
    <Flex
      direction="column"
      justify="center"
      css={{
        margin: "0 auto",
        height: "calc(100vh - 400px)",
        maxWidth: 450,
      }}>
      <Flex
        direction="column"
        justify="center"
        css={{
          margin: "0 auto",
          height: "calc(100vh - 400px)",
          maxWidth: 450,
        }}>
        <Heading css={{ fontWeight: 500, mb: "$3" }}>
          Upload your first On Demand asset
        </Heading>
        <Text variant="gray" css={{ lineHeight: 1.5, mb: "$3" }}>
          Livepeer Studio supports video on demand which allows you to import
          video assets, store them on decentralized storage, and easily mint a
          video NFT.
        </Text>

        <Box
          css={{
            display: "block",
            "@bp1": {
              display: "flex",
            },
          }}>
          <Link
            href="https://docs.livepeer.studio/category/on-demand "
            passHref>
            <A
              target="_blank"
              variant="primary"
              css={{ display: "flex", ai: "center", mb: "$5" }}>
              <Box>Learn more</Box>
              <ArrowRightIcon />
            </A>
          </Link>
        </Box>
        <Button
          onClick={() => createDialogState.onOn()}
          css={{ alignSelf: "flex-start" }}
          size="2"
          variant="primary">
          <PlusIcon />{" "}
          <Box as="span" css={{ ml: "$2" }}>
            Upload asset
          </Box>
        </Button>
      </Flex>
    </Flex>
  );
};

export default EmptyState;
