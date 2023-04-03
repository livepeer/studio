import {
  Flex,
  Heading,
  Box,
  Button,
  Text,
  Link as A,
} from "@livepeer/design-system";
import {
  ArrowRightIcon,
  ArrowTopRightIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { ToggleState } from "hooks/use-toggle-state";
import Link from "next/link";

const TableEmptyState = ({
  title,
  description,
  learnMoreUrl,
  primaryActionTitle,
  secondaryActionTitle = "Learn more",
  actionToggleState,
}: {
  title: string;
  description: string;
  learnMoreUrl: string;
  secondaryActionTitle?: string;
  primaryActionTitle?: string;
  actionToggleState?: ToggleState;
}) => (
  <Flex
    direction="column"
    justify="center"
    css={{
      margin: "0 auto",
      height: "calc(100vh - 400px)",
      maxWidth: 450,
    }}>
    <Heading css={{ fontWeight: 500, mb: "$3" }}>{title}</Heading>

    <Text variant="neutral" css={{ lineHeight: 1.5, mb: "$3" }}>
      {description}
    </Text>

    {actionToggleState && (
      <Flex align="center">
        <Button
          onClick={actionToggleState.onOn}
          css={{ alignSelf: "flex-start", mr: "$2" }}
          size="2"
          variant="primary">
          <PlusIcon />{" "}
          <Box as="span" css={{ ml: "$2" }}>
            {primaryActionTitle}
          </Box>
        </Button>

        <Link href={learnMoreUrl} passHref legacyBehavior>
          <A
            target="_blank"
            css={{
              textDecoration: "none",
              "&:hover": { textDecoration: "none" },
            }}>
            <Button
              ghost
              size={2}
              variant="neutral"
              css={{
                display: "flex",
                ai: "center",
                mb: "$5",
                gap: "$2",
                fontWeight: 500,
              }}>
              {secondaryActionTitle}
              <ArrowTopRightIcon />
            </Button>
          </A>
        </Link>
      </Flex>
    )}
  </Flex>
);

export default TableEmptyState;
