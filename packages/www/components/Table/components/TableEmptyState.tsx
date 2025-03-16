import { Link as A } from "@livepeer/design-system";
import { ArrowTopRightIcon, PlusIcon } from "@radix-ui/react-icons";
import { Button } from "components/ui/button";
import { Flex } from "components/ui/flex";
import { Text } from "components/ui/text";
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
  <Flex className="flex-col justify-center h-full max-w-md mx-auto gap-2 md:min-h-[500px]">
    <Text size="lg" weight="semibold">
      {title}
    </Text>

    <Text variant="neutral" size="sm" className="mb-2">
      {description}
    </Text>

    {actionToggleState && (
      <Flex className="sm:items-center gap-4 flex-col sm:flex-row">
        <Button onClick={actionToggleState.onOn} size="sm" variant="default">
          <PlusIcon /> <span className="ml-2">{primaryActionTitle}</span>
        </Button>

        <Link className="w-full" href={learnMoreUrl} passHref legacyBehavior>
          <A
            className="w-full"
            target="_blank"
            css={{
              textDecoration: "none",
              cursor: "default",
              "&:hover": { textDecoration: "none" },
            }}>
            <Button className="w-full sm:w-auto" variant="ghost">
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
